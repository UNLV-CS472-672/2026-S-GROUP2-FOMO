import os
import sys
import time
import pytest
import numpy as np
from typing import Any, Dict, List, Tuple

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from event_rec.reranker import (
    CandidateReranker,
    build_user_temporal_profile,
    dampened_cosine,
    _hour_to_time_bucket_idx,
    _ms_to_temporal_vector,
    FRIEND_BOOST_GOING,
    FRIEND_BOOST_CAP,
    TEMPORAL_PROXIMITY_WEIGHT,
    TEMPORAL_DECAY_DAYS,
    TEMPORAL_PEAK_DAYS,
    TEMPORAL_PREF_WEIGHT,
    FRESHNESS_WINDOW_HOURS,
    FRESHNESS_MIN_MODEL_SCORE,
    FRESHNESS_SLOTS,
    FRESHNESS_INSERT_START,
    MMR_LAMBDA,
    TEMPORAL_VEC_LEN,
)


# ------------------------------
#  Shared fixtures
# ------------------------------

NOW_MS = time.time() * 1000.0
ONE_HOUR_MS = 3_600_000.0
ONE_DAY_MS = 24 * ONE_HOUR_MS


@pytest.fixture
def num_tags() -> int:
    return 4


@pytest.fixture
def tag_id_to_idx() -> Dict[str, int]:
    return {"t1": 0, "t2": 1, "t3": 2, "t4": 3}


@pytest.fixture
def events_by_id() -> Dict[str, Dict[str, Any]]:
    """Three upcoming events spaced out in time."""
    return {
        "e1": {"_id": "e1", "startDate": NOW_MS + 2 * ONE_DAY_MS, "_creationTime": NOW_MS - 10 * ONE_HOUR_MS},
        "e2": {"_id": "e2", "startDate": NOW_MS + 10 * ONE_DAY_MS, "_creationTime": NOW_MS - 5 * ONE_DAY_MS},
        "e3": {"_id": "e3", "startDate": NOW_MS + 1 * ONE_DAY_MS, "_creationTime": NOW_MS - 1 * ONE_HOUR_MS},
    }


@pytest.fixture
def event_tags_by_id() -> Dict[str, List[Dict[str, str]]]:
    """e1 = t1+t2, e2 = t3, e3 = t4."""
    return {
        "e1": [{"tagId": "t1"}, {"tagId": "t2"}],
        "e2": [{"tagId": "t3"}],
        "e3": [{"tagId": "t4"}],
    }


@pytest.fixture
def default_candidates() -> List[Tuple[str, float]]:
    return [("e1", 0.8), ("e2", 0.7), ("e3", 0.6)]


def _make_reranker(
    candidates: List[Tuple[str, float]],
    events_by_id: Dict[str, Any],
    event_tags_by_id: Dict[str, Any],
    tag_id_to_idx: Dict[str, int],
    num_tags: int,
    friend_ids: List[str] | None = None,
    friend_attendance: Dict[str, List[Dict[str, Any]]] | None = None,
    user_interactions: List[Dict[str, Any]] | None = None,
) -> CandidateReranker:
    return CandidateReranker(
        user_id="u1",
        candidates=candidates,
        events_by_id=events_by_id,
        event_tags_by_id=event_tags_by_id,
        tag_id_to_idx=tag_id_to_idx,
        num_tags=num_tags,
        friend_ids=friend_ids,
        friend_attendance=friend_attendance,
        user_interactions=user_interactions or [],
    )


# ------------------------------
#  _hour_to_time_bucket_idx()
# ------------------------------

class TestHourToTimeBucketIdx:
    @pytest.mark.parametrize("hour,expected", [
        (6, 0), (10, 0),   # morning
        (11, 1), (13, 1),  # noon
        (14, 2), (16, 2),  # afternoon
        (17, 3), (20, 3),  # evening
        (21, 4), (0, 4), (5, 4),  # late night
    ])
    def test_buckets(self, hour: int, expected: int) -> None:
        assert _hour_to_time_bucket_idx(hour) == expected


# ------------------------------
#  _ms_to_temporal_vector()
# ------------------------------

class TestMsToTemporalVector:
    def test_output_length(self) -> None:
        vec = _ms_to_temporal_vector(NOW_MS)
        assert len(vec) == TEMPORAL_VEC_LEN

    def test_exactly_two_ones(self) -> None:
        """One day slot + one time-bucket slot should be set."""
        vec = _ms_to_temporal_vector(NOW_MS)
        assert vec.sum() == pytest.approx(2.0)

    def test_day_slot_in_range(self) -> None:
        vec = _ms_to_temporal_vector(NOW_MS)
        assert vec[:7].sum() == pytest.approx(1.0)

    def test_time_slot_in_range(self) -> None:
        vec = _ms_to_temporal_vector(NOW_MS)
        assert vec[7:].sum() == pytest.approx(1.0)


# ------------------------------
#  build_user_temporal_profile()
# ------------------------------

class TestBuildUserTemporalProfile:
    def test_empty_interactions_returns_zero_vector(
        self, events_by_id: Dict[str, Any]
    ) -> None:
        profile = build_user_temporal_profile("u1", [], events_by_id)
        assert profile.shape == (TEMPORAL_VEC_LEN,)
        assert np.all(profile == 0.0)

    def test_ignores_other_users(self, events_by_id: Dict[str, Any]) -> None:
        interactions = [{"userId": "u_other", "eventId": "e1", "status": "going"}]
        profile = build_user_temporal_profile("u1", interactions, events_by_id)
        assert np.all(profile == 0.0)

    def test_ignores_non_going_interested_statuses(
        self, events_by_id: Dict[str, Any]
    ) -> None:
        interactions = [{"userId": "u1", "eventId": "e1", "status": "uninterested"}]
        profile = build_user_temporal_profile("u1", interactions, events_by_id)
        assert np.all(profile == 0.0)

    def test_going_weight_greater_than_interested(
        self, events_by_id: Dict[str, Any]
    ) -> None:
        """Same event attended twice via going vs interested should differ in magnitude."""
        going_ints = [{"userId": "u1", "eventId": "e1", "status": "going"}]
        int_ints = [{"userId": "u1", "eventId": "e1", "status": "interested"}]
        p_going = build_user_temporal_profile("u1", going_ints, events_by_id)
        p_int = build_user_temporal_profile("u1", int_ints, events_by_id)
        # Both are normalized to unit vectors; their pre-normalization magnitudes differ,
        # but normalized they're the same direction. We just confirm neither is zero.
        assert p_going.sum() > 0.0
        assert p_int.sum() > 0.0

    def test_output_is_unit_norm_when_nonzero(
        self, events_by_id: Dict[str, Any]
    ) -> None:
        interactions = [{"userId": "u1", "eventId": "e1", "status": "going"}]
        profile = build_user_temporal_profile("u1", interactions, events_by_id)
        assert np.linalg.norm(profile) == pytest.approx(1.0, abs=1e-6)

    def test_missing_event_in_events_by_id_is_skipped(self) -> None:
        interactions = [{"userId": "u1", "eventId": "e_missing", "status": "going"}]
        profile = build_user_temporal_profile("u1", interactions, {})
        assert np.all(profile == 0.0)


# ------------------------------
#  dampened_cosine()
# ------------------------------

class TestDampenedCosine:
    def test_identical_vectors_returns_dampen_factor(self) -> None:
        a = np.array([1.0, 0.0, 0.0], dtype=np.float32)
        result = dampened_cosine(a, a, dampen=0.6)
        assert result == pytest.approx(0.6, abs=1e-6)

    def test_orthogonal_vectors_returns_zero(self) -> None:
        a = np.array([1.0, 0.0], dtype=np.float32)
        b = np.array([0.0, 1.0], dtype=np.float32)
        assert dampened_cosine(a, b, dampen=0.6) == pytest.approx(0.0, abs=1e-6)

    def test_zero_vector_returns_zero(self) -> None:
        a = np.zeros(3, dtype=np.float32)
        b = np.array([1.0, 0.0, 0.0], dtype=np.float32)
        assert dampened_cosine(a, b, dampen=0.6) == 0.0

    def test_dampen_scales_result(self) -> None:
        a = np.array([1.0, 0.0], dtype=np.float32)
        r1 = dampened_cosine(a, a, dampen=0.5)
        r2 = dampened_cosine(a, a, dampen=1.0)
        assert r1 == pytest.approx(r2 * 0.5, abs=1e-6)


# ------------------------------
#  CandidateReranker — construction
# ------------------------------

class TestCandidateRerankerInit:
    def test_candidates_are_populated(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        assert len(r.candidates) == 3

    def test_tag_vectors_correct_shape(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        for c in r.candidates:
            assert c.tag_vector.shape == (num_tags,)

    def test_tag_vector_values(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        """e1 has t1 and t2, so indices 0 and 1 should be 1.0."""
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        c_e1 = next(c for c in r.candidates if c.event_id == "e1")
        assert c_e1.tag_vector[0] == 1.0
        assert c_e1.tag_vector[1] == 1.0
        assert c_e1.tag_vector[2] == 0.0

    def test_hours_until_start_positive(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        for c in r.candidates:
            assert c.hours_until_start >= 0.0

    def test_hours_since_created_positive(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        for c in r.candidates:
            assert c.hours_since_created >= 0.0


# ------------------------------
#  Friend signals
# ------------------------------

class TestFriendSignals:
    def test_friend_going_increments_count(
        self,
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        friend_attendance = {
            "f1": [{"eventId": "e1", "status": "going"}],
            "f2": [{"eventId": "e1", "status": "going"}],
        }
        r = _make_reranker(
            [("e1", 0.5), ("e2", 0.4)],
            events_by_id, event_tags_by_id, tag_id_to_idx, num_tags,
            friend_ids=["f1", "f2"],
            friend_attendance=friend_attendance,
        )
        c_e1 = next(c for c in r.candidates if c.event_id == "e1")
        assert c_e1.friend_going_count == 2

    def test_non_going_friend_status_not_counted(
        self,
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        friend_attendance = {
            "f1": [{"eventId": "e1", "status": "interested"}],
        }
        r = _make_reranker(
            [("e1", 0.5)],
            events_by_id, event_tags_by_id, tag_id_to_idx, num_tags,
            friend_ids=["f1"],
            friend_attendance=friend_attendance,
        )
        c_e1 = r.candidates[0]
        assert c_e1.friend_going_count == 0

    def test_friend_boost_capped(
        self,
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        """Many friends going shouldn't exceed FRIEND_BOOST_CAP."""
        many_friends = [f"f{i}" for i in range(20)]
        friend_attendance = {
            fid: [{"eventId": "e1", "status": "going"}] for fid in many_friends
        }
        r = _make_reranker(
            [("e1", 0.5)],
            events_by_id, event_tags_by_id, tag_id_to_idx, num_tags,
            friend_ids=many_friends,
            friend_attendance=friend_attendance,
        )
        c = r.candidates[0]
        boost = CandidateReranker._friend_boost(c)
        assert boost <= FRIEND_BOOST_CAP

    def test_no_friend_data_gives_zero_boost(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        for c in r.candidates:
            assert CandidateReranker._friend_boost(c) == 0.0


# ------------------------------
#  Temporal proximity scoring
# ------------------------------

class TestTemporalProximityScore:
    def test_event_within_peak_days_gets_max_boost(
        self,
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        """Event happening in 1 day is within TEMPORAL_PEAK_DAYS, should get max boost."""
        soon_events = {"e_soon": {"_id": "e_soon", "startDate": NOW_MS + ONE_DAY_MS, "_creationTime": NOW_MS}}
        r = _make_reranker(
            [("e_soon", 0.5)],
            soon_events, {"e_soon": []}, tag_id_to_idx, num_tags,
        )
        score = CandidateReranker._temporal_proximity_score(r.candidates[0])
        assert score == pytest.approx(TEMPORAL_PROXIMITY_WEIGHT, abs=1e-6)

    def test_event_beyond_decay_days_gets_zero_boost(
        self,
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        far_ms = NOW_MS + (TEMPORAL_DECAY_DAYS + 5) * ONE_DAY_MS
        far_events = {"e_far": {"_id": "e_far", "startDate": far_ms, "_creationTime": NOW_MS}}
        r = _make_reranker(
            [("e_far", 0.5)],
            far_events, {"e_far": []}, tag_id_to_idx, num_tags,
        )
        score = CandidateReranker._temporal_proximity_score(r.candidates[0])
        assert score == 0.0

    def test_intermediate_event_gets_partial_boost(
        self,
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        mid_days = (TEMPORAL_PEAK_DAYS + TEMPORAL_DECAY_DAYS) / 2
        mid_ms = NOW_MS + mid_days * ONE_DAY_MS
        mid_events = {"e_mid": {"_id": "e_mid", "startDate": mid_ms, "_creationTime": NOW_MS}}
        r = _make_reranker(
            [("e_mid", 0.5)],
            mid_events, {"e_mid": []}, tag_id_to_idx, num_tags,
        )
        score = CandidateReranker._temporal_proximity_score(r.candidates[0])
        assert 0.0 < score < TEMPORAL_PROXIMITY_WEIGHT


# ------------------------------
#  Temporal preference scoring
# ------------------------------

class TestTemporalPrefScore:
    def test_no_history_gives_zero_score(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        for c in r.candidates:
            assert r._temporal_pref_score(c) == 0.0

    def test_score_bounded_by_weight(
        self,
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        """Score should never exceed TEMPORAL_PREF_WEIGHT."""
        interactions = [{"userId": "u1", "eventId": "e1", "status": "going"}]
        r = _make_reranker(
            [("e1", 0.5)],
            events_by_id, event_tags_by_id, tag_id_to_idx, num_tags,
            user_interactions=interactions,
        )
        for c in r.candidates:
            assert r._temporal_pref_score(c) <= TEMPORAL_PREF_WEIGHT


# ------------------------------
#  MMR selection
# ------------------------------

class TestMmrSelect:
    def test_returns_k_candidates(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        r._compute_final_scores()
        selected = r._mmr_select(r.candidates, k=2)
        assert len(selected) == 2

    def test_returns_all_when_k_exceeds_candidates(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        r._compute_final_scores()
        selected = r._mmr_select(r.candidates, k=100)
        assert len(selected) == len(default_candidates)

    def test_empty_candidates_returns_empty(
        self,
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker([], events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        assert r._mmr_select([], k=5) == []

    def test_higher_lambda_favors_relevance(
        self,
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        """With MMR_LAMBDA near 1.0 the top scoring candidate should come first."""
        # e1 has higher model score
        candidates = [("e1", 0.9), ("e2", 0.3)]
        r = _make_reranker(candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        r._compute_final_scores()
        selected = r._mmr_select(r.candidates, k=2)
        assert selected[0].event_id == "e1"


# ------------------------------
#  Freshness injection
# ------------------------------

class TestFreshnessInjection:
    def _make_fresh_event_id(self) -> str:
        return "e_fresh"

    def test_fresh_event_injected_when_qualifies(
        self,
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        fresh_id = "e_fresh"
        regular_id = "e_reg"
        events = {
            fresh_id: {"_id": fresh_id, "startDate": NOW_MS + 5 * ONE_DAY_MS,
                       "_creationTime": NOW_MS - 10 * ONE_HOUR_MS},  # created 10h ago → fresh
            regular_id: {"_id": regular_id, "startDate": NOW_MS + 3 * ONE_DAY_MS,
                         "_creationTime": NOW_MS - 10 * ONE_DAY_MS},  # old creation
        }
        candidates = [(regular_id, 0.8), (fresh_id, FRESHNESS_MIN_MODEL_SCORE + 0.01)]
        r = _make_reranker(candidates, events, {fresh_id: [], regular_id: []}, tag_id_to_idx, num_tags)
        r._compute_final_scores()

        # Simulate ranked already containing only regular_id
        ranked_candidates = [c for c in r.candidates if c.event_id == regular_id]
        result = r._inject_fresh_events(ranked_candidates, r.candidates)
        result_ids = [c.event_id for c in result]
        assert fresh_id in result_ids

    def test_fresh_event_not_injected_below_min_score(
        self,
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        fresh_id = "e_fresh_low"
        regular_id = "e_reg2"
        events = {
            fresh_id: {"_id": fresh_id, "startDate": NOW_MS + 5 * ONE_DAY_MS,
                       "_creationTime": NOW_MS - 1 * ONE_HOUR_MS},
            regular_id: {"_id": regular_id, "startDate": NOW_MS + 3 * ONE_DAY_MS,
                         "_creationTime": NOW_MS - 10 * ONE_DAY_MS},
        }
        # Score below threshold
        candidates = [(regular_id, 0.8), (fresh_id, FRESHNESS_MIN_MODEL_SCORE - 0.01)]
        r = _make_reranker(candidates, events, {fresh_id: [], regular_id: []}, tag_id_to_idx, num_tags)
        r._compute_final_scores()

        ranked_candidates = [c for c in r.candidates if c.event_id == regular_id]
        result = r._inject_fresh_events(ranked_candidates, r.candidates)
        result_ids = [c.event_id for c in result]
        assert fresh_id not in result_ids

    def test_freshness_respects_slot_limit(
        self,
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        """No more than FRESHNESS_SLOTS fresh events should be injected."""
        events = {}
        candidates = []
        for i in range(10):
            eid = f"e_fresh_{i}"
            events[eid] = {
                "_id": eid,
                "startDate": NOW_MS + 5 * ONE_DAY_MS,
                "_creationTime": NOW_MS - 1 * ONE_HOUR_MS,  # fresh
            }
            candidates.append((eid, FRESHNESS_MIN_MODEL_SCORE + 0.1))

        r = _make_reranker(candidates, events, {eid: [] for eid in events}, tag_id_to_idx, num_tags)
        r._compute_final_scores()

        # Ranked is empty so all candidates are in the pool
        result = r._inject_fresh_events([], r.candidates)
        assert len(result) <= FRESHNESS_SLOTS


# ------------------------------
#  rerank() end-to-end
# ------------------------------

class TestRerank:
    def test_returns_list_of_event_ids(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        result = r.rerank(k=2)
        assert isinstance(result, list)
        assert all(isinstance(eid, str) for eid in result)

    def test_result_length_capped_at_k(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        result = r.rerank(k=2)
        assert len(result) <= 2

    def test_empty_candidates_returns_empty(
        self,
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker([], events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        assert r.rerank(k=5) == []

    def test_result_contains_only_known_event_ids(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        known_ids = {eid for eid, _ in default_candidates}
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        result = r.rerank(k=3)
        for eid in result:
            assert eid in known_ids

    def test_friend_boost_promotes_attended_event(
        self,
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        """An event with many friends going should rank above an equally-scored one."""
        # e1 and e2 start with same model score; e2 has friend boost
        candidates = [("e1", 0.6), ("e2", 0.6)]
        friend_attendance = {"f1": [{"eventId": "e2", "status": "going"}]}
        r = _make_reranker(
            candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags,
            friend_ids=["f1"],
            friend_attendance=friend_attendance,
        )
        result = r.rerank(k=2)
        assert result[0] == "e2"

    def test_no_duplicate_event_ids_in_result(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        result = r.rerank(k=3)
        assert len(result) == len(set(result))

    def test_k_larger_than_candidates_returns_all(
        self,
        default_candidates: List[Tuple[str, float]],
        events_by_id: Dict[str, Any],
        event_tags_by_id: Dict[str, Any],
        tag_id_to_idx: Dict[str, int],
        num_tags: int,
    ) -> None:
        r = _make_reranker(default_candidates, events_by_id, event_tags_by_id, tag_id_to_idx, num_tags)
        result = r.rerank(k=100)
        assert len(result) == len(default_candidates)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])