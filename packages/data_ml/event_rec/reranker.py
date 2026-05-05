from __future__ import annotations

import time
from datetime import datetime, timezone
import numpy as np
from numpy.typing import NDArray
from dataclasses import dataclass, field


# constants

# Friend boost
FRIEND_BOOST_GOING = 0.25       # per friend marked "going"
FRIEND_BOOST_CAP = 0.60         # max total friend boost (diminishing returns)

# Temporal proximity (how soon the event is)
TEMPORAL_PEAK_DAYS = 3.0   # events this many days out get max boost
TEMPORAL_DECAY_DAYS = 21.0 # events this far out get zero boost
TEMPORAL_PROXIMITY_WEIGHT = 0.10     # max temporal proximity contribution

# Temporal preference match (day/time alignment with user history)
TEMPORAL_PREF_WEIGHT = 0.15    # max contribution from day/time preference match
TEMPORAL_PREF_DAMPEN = 0.6     # dampen cosine sim
#   Time-of-day buckets (hour ranges)
#   morning:    6–11
#   noon:       11–14
#   afternoon:  14–17
#   evening:    17–21
#   late_night: 21–6
#
#   Vector layout: [Mon, Tue, Wed, Thu, Fri, Sat, Sun, morning, noon, afternoon, evening, late_night]
TEMPORAL_VEC_LEN = 12
#   Weight going vs interested when building user profile
TEMPORAL_GOING_WEIGHT = 1.0
TEMPORAL_INTERESTED_WEIGHT = 0.4

# 4. Freshness injection
FRESHNESS_WINDOW_HOURS = 72.0     # events created within this window are "fresh"
FRESHNESS_MIN_MODEL_SCORE = 0.35  # minimum model score to qualify for freshness slot
FRESHNESS_SLOTS = 2               # number of reserved slots for fresh events
FRESHNESS_INSERT_START = 3        # inject starting at this position (0-indexed)

# 5. MMR diversity
MMR_LAMBDA = 0.70  # 1.0 = pure relevance, 0.0 = pure diversity



# Temporal helpers
def _hour_to_time_bucket_idx(hour: int) -> int:
    """Map hour (0-23) to time bucket index (0-4)."""
    if 6 <= hour < 11:
        return 0   # morning
    elif 11 <= hour < 14:
        return 1   # noon
    elif 14 <= hour < 17:
        return 2   # afternoon
    elif 17 <= hour < 21:
        return 3   # evening
    else:
        return 4   # late_night (21-5)


def _ms_to_temporal_vector(start_ms: float) -> NDArray[np.float32]:
    """
    Convert an event start timestamp (ms since epoch) to a temporal
    vector of length 12: [7 day-of-week slots | 5 time-of-day slots].
    1.0 at the event's day and time bucket, 0.0 elsewhere.
    """
    vec = np.zeros(TEMPORAL_VEC_LEN, dtype=np.float32)
    dt = datetime.fromtimestamp(start_ms / 1000.0, tz=timezone.utc)
    vec[dt.weekday()] = 1.0                          # Mon=0 .. Sun=6
    vec[7 + _hour_to_time_bucket_idx(dt.hour)] = 1.0  # time bucket
    return vec


def build_user_temporal_profile(
    user_id: str,
    user_interactions: list[dict],
    events_by_id: dict[str, dict],
) -> NDArray[np.float32]:
    """
    Build a temporal preference profile for a user from their attendance history.
    Accumulates weighted counts across day-of-week and time-of-day buckets
    from events the user marked going or interested.
    Returns a normalized vector of length 12.
    """
    profile = np.zeros(TEMPORAL_VEC_LEN, dtype=np.float32)

    for row in user_interactions:
        if row.get("userId") != user_id:
            continue

        status = row.get("status")
        if status == "going":
            weight = TEMPORAL_GOING_WEIGHT
        elif status == "interested":
            weight = TEMPORAL_INTERESTED_WEIGHT
        else:
            continue

        event = events_by_id.get(row.get("eventId", ""), {})
        start_ms = event.get("startDate")
        if start_ms is None:
            continue

        profile += _ms_to_temporal_vector(start_ms) * weight

    # Normalize so magnitude doesn't depend on attendance count
    norm = np.linalg.norm(profile)
    if norm > 1e-9:
        profile = profile / norm

    return profile


def dampened_cosine(a: NDArray[np.float32], b: NDArray[np.float32], dampen: float) -> float:
    """Cosine similarity scaled by a dampening factor."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a < 1e-9 or norm_b < 1e-9:
        return 0.0
    return float(dampen * dot / (norm_a * norm_b))


# Data container for a scored candidate
@dataclass
class Candidate:
    event_id: str
    model_score: float
    final_score: float = 0.0

    # metadata populated during reranking
    friend_going_count: int = 0
    hours_until_start: float = 0.0
    hours_since_created: float = 0.0
    tag_vector: NDArray[np.float32] = field(default_factory=lambda: np.zeros(0, dtype=np.float32))
    temporal_vector: NDArray[np.float32] = field(default_factory=lambda: np.zeros(TEMPORAL_VEC_LEN, dtype=np.float32))


# Reranker

class CandidateReranker:
    """
    Usage from recommendEvent.py:

        reranker = CandidateReranker(
            user_id=user_id,
            candidates=[(event_id, model_score), ...],
            events_by_id=events_by_id,
            event_tags_by_id=event_tags_by_id,
            tag_id_to_idx=tag_id_to_idx,
            num_tags=num_tags,
            friend_ids=friend_ids,
            friend_attendance=friend_attendance_by_user,
            user_interactions=user_interactions,
        )
        ranked_event_ids = reranker.rerank(k=10)
    """

    def __init__(
        self,
        user_id: str,
        candidates: list[tuple[str, float]],
        events_by_id: dict[str, dict],
        event_tags_by_id: dict[str, list[dict[str, str]]],
        tag_id_to_idx: dict[str, int],
        num_tags: int,
        friend_ids: list[str] | None = None,
        friend_attendance: dict[str, list[dict]] | None = None,
        user_interactions: list[dict] | None = None,
    ):
        self.user_id = user_id
        self.num_tags = num_tags
        self.tag_id_to_idx = tag_id_to_idx
        self.now_ms = time.time() * 1000.0

        # Build user temporal profile from their attendance history
        self.user_temporal_profile = build_user_temporal_profile(
            user_id,
            user_interactions or [],
            events_by_id,
        )

        # Build Candidate objects
        self.candidates: list[Candidate] = []
        for event_id, model_score in candidates:
            c = Candidate(event_id=event_id, model_score=model_score)

            event = events_by_id.get(event_id, {})

            # Tag vector for MMR similarity
            tags = np.zeros(num_tags, dtype=np.float32)
            for row in event_tags_by_id.get(event_id, []):
                if row["tagId"] in tag_id_to_idx:
                    tags[tag_id_to_idx[row["tagId"]]] = 1.0
            c.tag_vector = tags

            # Temporal proximity: hours until event starts
            start_ms = event.get("startDate", self.now_ms)
            c.hours_until_start = max(0.0, (start_ms - self.now_ms) / 3_600_000.0)

            # Freshness: hours since event was created
            creation_ms = event.get("_creationTime", self.now_ms)
            c.hours_since_created = max(0.0, (self.now_ms - creation_ms) / 3_600_000.0)

            # Temporal preference vector for this event's day/time
            c.temporal_vector = _ms_to_temporal_vector(start_ms)

            self.candidates.append(c)

        # Pre-compute friend data
        self._populate_friend_signals(friend_ids, friend_attendance)



    # Signal population
    def _populate_friend_signals(
        self,
        friend_ids: list[str] | None,
        friend_attendance: dict[str, list[dict]] | None,
    ) -> None:
        """Count how many friends are going per event."""
        if friend_ids is None or friend_attendance is None:
            return

        friend_set = set(friend_ids)

        going_count: dict[str, int] = {}
        for fid in friend_set:
            for row in friend_attendance.get(fid, []):
                if row.get("status") == "going":
                    eid = row.get("eventId", "")
                    going_count[eid] = going_count.get(eid, 0) + 1

        for c in self.candidates:
            c.friend_going_count = going_count.get(c.event_id, 0)


    # Scoring
    @staticmethod
    def _friend_boost(c: Candidate) -> float:
        raw = c.friend_going_count * FRIEND_BOOST_GOING
        return min(raw, FRIEND_BOOST_CAP)

    @staticmethod
    def _temporal_proximity_score(c: Candidate) -> float:
        """
        Events happening soon get a boost
        """
        days_out = c.hours_until_start / 24.0
        if days_out <= TEMPORAL_PEAK_DAYS:
            return TEMPORAL_PROXIMITY_WEIGHT
        if days_out >= TEMPORAL_DECAY_DAYS:
            return 0.0
        return TEMPORAL_PROXIMITY_WEIGHT * (1.0 - (days_out - TEMPORAL_PEAK_DAYS) / (TEMPORAL_DECAY_DAYS - TEMPORAL_PEAK_DAYS))

    def _temporal_pref_score(self, c: Candidate) -> float:
        """
        Dampened cosine similarity between user's temporal profile
        (which days/times they tend to attend events) and this
        candidate event's day/time slot.
        """
        sim = dampened_cosine(self.user_temporal_profile, c.temporal_vector, TEMPORAL_PREF_DAMPEN)
        return TEMPORAL_PREF_WEIGHT * max(0.0, sim)

    def _compute_final_scores(self) -> None:
        for c in self.candidates:
            c.final_score = (
                c.model_score
                + self._friend_boost(c)
                + self._temporal_proximity_score(c)
                + self._temporal_pref_score(c)
            )


    # MMR diversity selection
    def _mmr_select(self, scored: list[Candidate], k: int) -> list[Candidate]:
        """
        Maximal Marginal Relevance: greedily pick candidates that balance
        relevance (final_score) with diversity (tag-vector dissimilarity
        to already-selected events).
        """
        if not scored or k <= 0:
            return []

        selected: list[Candidate] = []
        remaining = list(scored)

        remaining.sort(key=lambda c: c.final_score, reverse=True)
        selected.append(remaining.pop(0))

        while remaining and len(selected) < k:
            best_mmr = -float("inf")
            best_idx = 0

            for i, cand in enumerate(remaining):
                max_sim = 0.0
                for sel in selected:
                    sim = self._tag_cosine(cand.tag_vector, sel.tag_vector)
                    if sim > max_sim:
                        max_sim = sim

                mmr = MMR_LAMBDA * cand.final_score - (1.0 - MMR_LAMBDA) * max_sim
                if mmr > best_mmr:
                    best_mmr = mmr
                    best_idx = i

            selected.append(remaining.pop(best_idx))

        return selected

    @staticmethod
    def _tag_cosine(a: NDArray[np.float32], b: NDArray[np.float32]) -> float:
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a < 1e-9 or norm_b < 1e-9:
            return 0.0
        return float(dot / (norm_a * norm_b))


    # Freshness injection
    def _inject_fresh_events(
        self, ranked: list[Candidate], pool: list[Candidate]
    ) -> list[Candidate]:
        """
        Reserve up to FRESHNESS_SLOTS positions for recently created events
        that meet the minimum relevance bar but didn't make the MMR cut.
        """
        ranked_ids = {c.event_id for c in ranked}

        fresh_candidates = [
            c for c in pool
            if c.event_id not in ranked_ids
            and c.hours_since_created <= FRESHNESS_WINDOW_HOURS
            and c.model_score >= FRESHNESS_MIN_MODEL_SCORE
        ]

        fresh_candidates.sort(key=lambda c: c.model_score, reverse=True)

        injected = 0
        insert_pos = min(FRESHNESS_INSERT_START, len(ranked))

        for fresh in fresh_candidates:
            if injected >= FRESHNESS_SLOTS:
                break
            ranked.insert(insert_pos, fresh)
            insert_pos += 1
            injected += 1

        return ranked


    # Rerank
    def rerank(self, k: int = 10) -> list[str]:
        """
        Full re-ranking pipeline:
          1. Score all candidates (model + friend + temporal proximity + temporal pref)
          2. MMR-select top k for diversity (full budget — freshness pulls from this pool)
          3. Inject up to FRESHNESS_SLOTS fresh events from the full candidate pool,
             replacing tail MMR slots so the total never shrinks below min(k, candidates)
          4. Trim to final k
          5. Return ordered event IDs

        Returns:
            List of event_id strings, length <= k, best-first.
        """
        if not self.candidates:
            return []

        self._compute_final_scores()

        mmr_selected = self._mmr_select(self.candidates, k)

        # Inject fresh events from the *full* pool (including what MMR didn't pick).
        # _inject_fresh_events already excludes ids already in the ranked list, so
        # it will preferentially pull from outside mmr_selected — but if there aren't
        # enough fresh events outside it, the ranked list is still length k (no shrinkage).
        final = self._inject_fresh_events(mmr_selected, self.candidates)
        final = final[:k]

        return [c.event_id for c in final]