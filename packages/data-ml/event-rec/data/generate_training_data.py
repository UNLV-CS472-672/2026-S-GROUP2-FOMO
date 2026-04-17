"""
Generates realistic training data for the FOMO Two-Tower recommendation model.

Output files (in training/training_data/):
  user_features.npy        : (num_users, 3 * num_tags)   float32
                               [0:T]    attended tag weights
                               [T:2T]   interested tag weights
                               [2T:3T]  blocked tag weights
  event_features.npy       : (num_events, num_tags + 4)  float32
                               [:T]     tag multihot
                               [T+0]    tag_count_norm
                               [T+1]    day_of_week_norm
                               [T+2]    hour_norm
                               [T+3]    is_free
  triplets.npy             : (N, 3) int32  [user_idx, pos_event_idx, neg_event_idx]
  tag_index.json           : {tag_name: col_index}

Interaction model per persona:
  attended   → strong positive  (weight = 1.0)
  interested → weak positive    (weight = 0.5)
  blocked    → strong negative  (stored in blocked slice)

Triplet mining strategy:
  positive  : attended events (preferred) or interested events
  hard neg  : blocked events that share tags with attended events
              → forces the model to learn beyond raw tag overlap
  easy neg  : random low-overlap events

Formula mirrors updateUserPreferences.py:
  bounded = 1 - exp(-(weighted_sum + BETA) / TAU)
"""

import json
import random
import numpy as np
from pathlib import Path


# ── 1. Tag vocabulary ──────────────────────────────────────────────────────────

# Hardcoded to match tag_index.json exactly — do not reorder
TAG_IDX = {
    "music":      0,
    "food":       1,
    "study":      2,
    "rap":        3,
    "fair":       4,
    "panel":      5,
    "conference": 6,
    "comics":     7,
    "concert":    8,
    "art":        9,
    "party":      10,
    "college":    11,
    "vendors":    12,
    "anime":      13,
    "birthday":   14,
    "chinatown":  15,
    "wild":       16,
    "insightful": 17,
    "drink":      18,
    "convention": 19,
    "r&b":        20,
    "chill":      21,
    "clothes":    22,
    "thrift":     23,
    "culture":    24,
    "fits":       25,
    "games":      26,
}
TAGS     = [t for t, _ in sorted(TAG_IDX.items(), key=lambda x: x[1])]
NUM_TAGS = len(TAG_IDX)
MAX_TAGS = 8   # rough upper bound on tags per event, used for normalization


# ── 2. Event archetypes ────────────────────────────────────────────────────────
# (name, required_tags, optional_tags, optional_prob, typical_dow, typical_hour, is_free)
# dow: 0=Mon … 6=Sun

EVENT_ARCHETYPES = [
    ("rap_concert",      ["concert", "rap", "music"],           ["wild", "drink", "party"],             0.6, [4,5,6], [20,21,22], False),
    ("rb_concert",       ["concert", "r&b", "music"],           ["chill", "drink", "party"],            0.6, [4,5,6], [19,20,21], False),
    ("anime_convention", ["convention", "anime", "comics"],     ["vendors", "art", "games"],            0.7, [5,6],   [10,11,12], False),
    ("gaming_meetup",    ["games"],                             ["anime", "comics", "wild"],            0.5, [5,6],   [14,15,16], True),
    ("art_fair",         ["art", "fair", "vendors"],            ["culture", "food", "insightful"],      0.6, [5,6],   [11,12,13], True),
    ("thrift_market",    ["thrift", "vendors", "clothes"],      ["fair", "food", "fits"],               0.7, [5,6],   [10,11,12], True),
    ("college_party",    ["party", "college"],                  ["drink", "wild", "music"],             0.8, [4,5],   [21,22,23], True),
    ("birthday_party",   ["birthday", "party"],                 ["drink", "food", "music", "wild"],     0.7, [5,6],   [18,19,20], True),
    ("food_festival",    ["food", "fair", "vendors"],           ["drink", "culture", "music"],          0.6, [5,6],   [11,12,13], False),
    ("study_group",      ["study", "college"],                  ["insightful", "chill"],                0.6, [0,1,2], [14,15,16], True),
    ("conference_panel", ["conference", "panel", "insightful"], ["college", "culture", "study"],        0.5, [1,2,3], [9,10,11],  False),
    ("chinatown_event",  ["chinatown", "culture", "food"],      ["vendors", "art", "fair"],             0.6, [5,6],   [11,12,13], True),
    ("fashion_show",     ["fits", "clothes", "art"],            ["culture", "thrift", "party"],         0.5, [5,6],   [17,18,19], False),
    ("chill_hangout",    ["chill"],                             ["food", "drink", "music", "r&b"],      0.6, [4,5,6], [16,17,18], True),
    ("rap_cypher",       ["rap", "wild"],                       ["music", "college", "party"],          0.6, [4,5],   [19,20,21], True),
    ("comics_expo",      ["comics", "convention", "vendors"],   ["games", "anime", "art"],              0.7, [5,6],   [10,11,12], False),
    ("culture_fest",     ["culture", "fair"],                   ["food", "music", "art", "chinatown"],  0.65,[5,6],   [11,12,13], True),
    ("open_mic",         ["music", "art"],                      ["r&b", "rap", "chill", "party"],       0.6, [3,4,5], [19,20,21], True),
    ("night_out",        ["drink", "wild", "party"],            ["music", "r&b", "rap"],                0.7, [4,5,6], [22,23,0],  False),
    ("campus_fair",      ["college", "fair", "vendors"],        ["study", "food", "games"],             0.6, [1,2,3], [10,11,12], True),
]


def generate_event(archetype: tuple) -> np.ndarray:
    """Returns (num_tags + 4,) feature vector for one event."""
    name, required, optional, prob, dow_choices, hour_choices, is_free = archetype

    # Tag multihot
    tags = np.zeros(NUM_TAGS, dtype=np.float32)
    for tag in required:
        tags[TAG_IDX[tag]] = 1.0
    for tag in optional:
        if random.random() < prob:
            tags[TAG_IDX[tag]] = 1.0

    tag_count_norm  = tags.sum() / MAX_TAGS
    day_norm        = random.choice(dow_choices) / 6.0
    hour_norm       = random.choice(hour_choices) / 23.0
    free_flag       = float(is_free)

    return np.concatenate([tags, [tag_count_norm, day_norm, hour_norm, free_flag]]).astype(np.float32)


# ── 3. User personas ───────────────────────────────────────────────────────────
# (name, primary_tags, secondary_tags, blocked_tags,
#  n_attended_primary, n_attended_secondary,
#  n_interested, n_blocked)

USER_PERSONAS = [
    ("music_head",
        ["concert", "music", "r&b", "rap"], ["party", "drink", "chill"], ["study", "conference", "panel"],
        12, 4, 6, 4),

    ("anime_fan",
        ["anime", "comics", "convention", "games"], ["art", "vendors"], ["party", "wild", "drink"],
        14, 4, 5, 4),

    ("college_student",
        ["study", "college", "insightful"], ["food", "chill", "party"], ["wild", "drink", "rap"],
        10, 5, 6, 3),

    ("party_animal",
        ["party", "drink", "wild"], ["music", "rap", "r&b"], ["study", "conference", "insightful"],
        15, 4, 5, 4),

    ("art_lover",
        ["art", "culture", "insightful"], ["fair", "vendors", "food"], ["wild", "rap", "party"],
        11, 5, 5, 3),

    ("streetwear_fan",
        ["fits", "clothes", "thrift"], ["culture", "art", "vendors"], ["wild", "drink", "study"],
        12, 4, 5, 3),

    ("foodie",
        ["food", "fair", "vendors"], ["culture", "drink", "music"], ["anime", "comics", "convention"],
        13, 4, 5, 3),

    ("gamer",
        ["games", "anime", "comics"], ["convention", "wild", "chill"], ["conference", "panel", "study"],
        12, 4, 5, 4),

    ("hip_hop_head",
        ["rap", "concert", "music"], ["r&b", "wild", "party"], ["study", "conference", "anime"],
        13, 4, 5, 4),

    ("culture_vulture",
        ["culture", "chinatown", "art"], ["food", "insightful", "fair"], ["wild", "party", "drink"],
        11, 5, 5, 3),

    ("networker",
        ["conference", "panel", "insightful"], ["college", "study", "culture"], ["wild", "party", "drink"],
        10, 4, 5, 4),

    ("night_crawler",
        ["drink", "wild", "party"], ["music", "concert", "rap"], ["study", "conference", "anime"],
        14, 4, 5, 4),

    ("chill_vibe",
        ["chill", "r&b", "music"], ["food", "drink", "art"], ["wild", "rap", "convention"],
        10, 5, 5, 3),

    ("campus_org",
        ["college", "fair", "panel"], ["study", "conference", "vendors"], ["wild", "drink", "anime"],
        11, 4, 5, 3),

    ("vendor_hopper",
        ["vendors", "thrift", "fair"], ["food", "art", "culture"], ["wild", "party", "drink"],
        13, 4, 5, 3),
]


# ── 4. Weight formula ──────────────────────────────────────────────────────────

BETA = 0.10
TAU  = 1.25


def build_weights(mat: np.ndarray, weight: float = 1.0) -> np.ndarray:
    """
    Converts an (n_events, num_tags) attendance matrix into a (num_tags,) weight vector.
    `weight` scales row contributions before the bounding formula:
      - attended  → weight=1.0  (full signal)
      - interested → weight=0.5 (half signal)
      - blocked   → weight=1.0  (full signal, stored in its own slice)
    """
    if mat.shape[0] == 0:
        return np.zeros(NUM_TAGS, dtype=np.float32)

    row_sums = mat.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1.0
    normalized  = mat / row_sums
    tag_weights = normalized.sum(axis=0) * weight

    return (1.0 - np.exp(-(tag_weights + BETA) / TAU)).astype(np.float32)


# ── 5. Simulate interactions ───────────────────────────────────────────────────

def _score_archetype(arch: tuple, tag_set: set) -> int:
    return len(set(arch[1]) & tag_set)


def simulate_user(persona: tuple) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[int], list[int], list[int]]:
    """
    Returns:
        attended_weights   : (num_tags,)
        interested_weights : (num_tags,)
        blocked_weights    : (num_tags,)
        attended_indices   : list of archetype indices attended
        interested_indices : list of archetype indices interested in
        blocked_indices    : list of archetype indices blocked
    """
    _, primary, secondary, blocked_tags, n_att_pri, n_att_sec, n_int, n_blk = persona

    primary_set  = set(primary)
    second_set   = set(secondary)
    blocked_set  = set(blocked_tags)

    by_primary   = sorted(range(len(EVENT_ARCHETYPES)), key=lambda i: _score_archetype(EVENT_ARCHETYPES[i], primary_set),  reverse=True)
    by_secondary = sorted(range(len(EVENT_ARCHETYPES)), key=lambda i: _score_archetype(EVENT_ARCHETYPES[i], second_set),   reverse=True)
    by_blocked   = sorted(range(len(EVENT_ARCHETYPES)), key=lambda i: _score_archetype(EVENT_ARCHETYPES[i], blocked_set),  reverse=True)

    top_primary   = by_primary[:6]
    top_secondary = by_secondary[:6]
    top_blocked   = by_blocked[:4]

    attended_rows   = []
    interested_rows = []
    blocked_rows    = []

    att_indices = []
    int_indices = []
    blk_indices = []

    for _ in range(n_att_pri):
        idx = random.choice(top_primary)
        att_indices.append(idx)
        attended_rows.append(generate_event(EVENT_ARCHETYPES[idx])[:NUM_TAGS])

    for _ in range(n_att_sec):
        idx = random.choice(top_secondary)
        att_indices.append(idx)
        attended_rows.append(generate_event(EVENT_ARCHETYPES[idx])[:NUM_TAGS])

    for _ in range(n_int):
        idx = random.choice(top_primary + top_secondary)
        int_indices.append(idx)
        interested_rows.append(generate_event(EVENT_ARCHETYPES[idx])[:NUM_TAGS])

    for _ in range(n_blk):
        idx = random.choice(top_blocked)
        blk_indices.append(idx)
        blocked_rows.append(generate_event(EVENT_ARCHETYPES[idx])[:NUM_TAGS])

    att_mat  = np.array(attended_rows,   dtype=np.float32) if attended_rows   else np.zeros((0, NUM_TAGS), dtype=np.float32)
    int_mat  = np.array(interested_rows, dtype=np.float32) if interested_rows else np.zeros((0, NUM_TAGS), dtype=np.float32)
    blk_mat  = np.array(blocked_rows,    dtype=np.float32) if blocked_rows    else np.zeros((0, NUM_TAGS), dtype=np.float32)

    return (
        build_weights(att_mat,  weight=1.0),
        build_weights(int_mat,  weight=0.5),
        build_weights(blk_mat,  weight=1.0),
        att_indices,
        int_indices,
        blk_indices,
    )


# ── 6. Generate users ──────────────────────────────────────────────────────────

NUM_USERS = 10_000

# Behavior profiles control how active a user is and which interaction
# types they use. Mixed into the population so the model sees all patterns.
#
# (profile_name, att_scale, int_scale, blk_scale, weight)
#   att_scale : multiplier on n_attended counts
#   int_scale : multiplier on n_interested — 0.0 means no interested events at all
#   blk_scale : multiplier on n_blocked    — 0.0 means no blocked events at all
#   weight    : how often this profile appears in the population (sums to 1.0)

BEHAVIOR_PROFILES = [
    # name                att    int    blk    weight
    ("active",            1.0,   1.0,   1.0,   0.25),  # typical engaged user, all three types
    ("power_user",        1.8,   1.4,   1.4,   0.10),  # highly active, lots of history
    ("casual",            0.4,   0.5,   0.5,   0.15),  # attends a little, some interest/blocks
    ("attended_only",     1.0,   0.0,   0.0,   0.12),  # only attendance data, no interest/blocks
    ("no_blocked",        1.0,   1.0,   0.0,   0.10),  # attends + interested, never blocks
    ("no_interested",     1.0,   0.0,   1.0,   0.08),  # attends + blocks, never marks interested
    ("lurker",            0.2,   0.3,   0.0,   0.08),  # barely any history, no blocks
    ("new_user",          0.0,   0.0,   0.0,   0.07),  # cold start — zero interactions
    ("interested_heavy",  0.5,   2.0,   0.5,   0.05),  # browses a lot, attends less
]

# Precompute cumulative weights for weighted random sampling
_profile_weights = [p[4] for p in BEHAVIOR_PROFILES]
_profile_total   = sum(_profile_weights)
_profile_cumsum: list[float] = []
_running = 0.0
for _w in _profile_weights:
    _running += _w / _profile_total
    _profile_cumsum.append(_running)


def _sample_profile() -> tuple:
    r = random.random()
    for i, threshold in enumerate(_profile_cumsum):
        if r <= threshold:
            return BEHAVIOR_PROFILES[i]
    return BEHAVIOR_PROFILES[-1]


def generate_users() -> tuple[np.ndarray, list[tuple[list,list,list]]]:
    user_features       = []
    interaction_history = []

    profile_counts: dict[str, int] = {p[0]: 0 for p in BEHAVIOR_PROFILES}

    for i in range(NUM_USERS):
        persona = USER_PERSONAS[i % len(USER_PERSONAS)]
        profile = _sample_profile()
        profile_name, att_scale, int_scale, blk_scale, _ = profile
        profile_counts[profile_name] += 1

        # Cold start — all-zero vector, empty history
        if att_scale == 0.0 and int_scale == 0.0 and blk_scale == 0.0:
            user_features.append(np.zeros(3 * NUM_TAGS, dtype=np.float32))
            interaction_history.append(([], [], []))
            continue

        jitter = random.uniform(0.8, 1.2)

        jittered = (
            persona[0], persona[1], persona[2], persona[3],
            max(1, int(persona[4] * att_scale * jitter)),
            max(1, int(persona[5] * att_scale * jitter)),
            max(1, int(persona[6] * int_scale * jitter)) if int_scale > 0.0 else 0,
            max(1, int(persona[7] * blk_scale * jitter)) if blk_scale > 0.0 else 0,
        )

        att_w, int_w, blk_w, att_idx, int_idx, blk_idx = simulate_user(jittered)
        user_features.append(np.concatenate([att_w, int_w, blk_w]))
        interaction_history.append((att_idx, int_idx, blk_idx))

    # Print breakdown so you can verify the distribution looks right
    print("  Profile breakdown:")
    for name, count in profile_counts.items():
        print(f"    {name:<20} {count:>5} ({count/NUM_USERS*100:.1f}%)")

    return np.array(user_features, dtype=np.float32), interaction_history


# ── 7. Generate events ─────────────────────────────────────────────────────────

NUM_EVENTS = 4_000


def generate_events() -> np.ndarray:
    return np.array(
        [generate_event(random.choice(EVENT_ARCHETYPES)) for _ in range(NUM_EVENTS)],
        dtype=np.float32,
    )


# ── 8. Mine BPR triplets ───────────────────────────────────────────────────────

TRIPLETS_PER_USER = 20


def cosine_sim_attended(user_features: np.ndarray, event_features: np.ndarray) -> np.ndarray:
    """
    Similarity using only the attended slice of user features vs event tag multihot.
    Used for triplet mining — we want to rank events by how well they match
    the user's attendance pattern, ignoring the interested/blocked slices here.
    """
    num_tags   = event_features.shape[1] - 4
    att_weights = user_features[:, :num_tags]          # (U, T)
    event_tags  = event_features[:, :num_tags]          # (E, T)

    dot    = att_weights @ event_tags.T                 # (U, E)
    u_norm = np.linalg.norm(att_weights, axis=1, keepdims=True) + 1e-8
    e_norm = np.linalg.norm(event_tags,  axis=1, keepdims=True) + 1e-8

    return dot / (u_norm * e_norm.T)                    # (U, E)


def mine_triplets(
    user_features: np.ndarray,
    event_features: np.ndarray,
    interaction_history: list[tuple[list,list,list]],
) -> np.ndarray:
    num_tags   = event_features.shape[1] - 4
    event_tags = event_features[:, :num_tags]                        # (E, T)
    sim        = cosine_sim_attended(user_features, event_features)  # (U, E)
    num_events = event_tags.shape[0]
    triplets   = []

    # Precompute per-archetype event masks once — O(archetypes * E) instead of O(U * E)
    # arch_blk_masks[i] is a boolean (E,) array: True if event shares a required tag
    # with archetype i. Built outside the user loop so it's never recomputed.
    arch_blk_masks: list[np.ndarray] = []
    for arch in EVENT_ARCHETYPES:
        required_tags = arch[1]
        tag_indices   = [TAG_IDX[t] for t in required_tags if t in TAG_IDX]
        if tag_indices:
            mask = event_tags[:, tag_indices].sum(axis=1) > 0
        else:
            mask = np.zeros(num_events, dtype=bool)
        arch_blk_masks.append(mask)

    # Precompute per-user median in one vectorized call
    medians = np.median(sim, axis=1)   # (U,)

    for u_idx in range(len(user_features)):
        scores = sim[u_idx]                    # (E,)
        ranked = np.argsort(scores)[::-1]      # (E,) sorted indices

        pos_pool = ranked[:30].tolist()

        _, _, blk_arch = interaction_history[u_idx]
        if blk_arch:
            blk_mask = np.zeros(num_events, dtype=bool)
            for arch_idx in blk_arch:
                blk_mask |= arch_blk_masks[arch_idx]
            hard_neg_pool = np.where(blk_mask & (scores < medians[u_idx]))[0].tolist()
        else:
            hard_neg_pool = []

        easy_neg_pool = ranked[int(0.75 * num_events):].tolist()

        if not hard_neg_pool:
            hard_neg_pool = ranked[40:150].tolist()

        for _ in range(TRIPLETS_PER_USER):
            pos_idx  = random.choice(pos_pool)
            use_hard = random.random() < 0.6
            neg_idx  = random.choice(hard_neg_pool if use_hard else easy_neg_pool)

            if scores[pos_idx] > scores[neg_idx]:
                triplets.append([u_idx, pos_idx, neg_idx])

    return np.array(triplets, dtype=np.int32)


# ── 9. Main ────────────────────────────────────────────────────────────────────

def main() -> None:
    random.seed(42)
    np.random.seed(42)

    out = Path("training/training_data")
    out.mkdir(parents=True, exist_ok=True)

    print("Generating users...")
    user_features, interaction_history = generate_users()
    print(f"  {user_features.shape[0]} users | feature dim: {user_features.shape[1]} (3 × {NUM_TAGS} tags)")

    print("Generating events...")
    event_features = generate_events()
    print(f"  {event_features.shape[0]} events | feature dim: {event_features.shape[1]} ({NUM_TAGS} tags + 4 scalars)")

    print("Mining triplets...")
    triplets = mine_triplets(user_features, event_features, interaction_history)
    print(f"  {len(triplets):,} triplets")

    np.save(out / "user_features.npy",   user_features)
    np.save(out / "event_features.npy",  event_features)
    np.save(out / "triplets.npy",        triplets)
    with open(out / "tag_index.json", "w") as f:
        json.dump(TAG_IDX, f, indent=2)

    print("\n── Dataset Stats ──────────────────────────────────────────")
    print(f"  Users:    {user_features.shape[0]:>6,}")
    print(f"  Events:   {event_features.shape[0]:>6,}")
    print(f"  Triplets: {len(triplets):>6,}")
    print(f"  Tags:     {NUM_TAGS}")

    event_tags  = event_features[:, :NUM_TAGS]
    print(f"\n  Avg tags per event:       {event_tags.sum(axis=1).mean():.2f}")
    print(f"  Avg attended weight sum:  {user_features[:, :NUM_TAGS].sum(axis=1).mean():.2f}")
    print(f"  Avg blocked weight sum:   {user_features[:, 2*NUM_TAGS:].sum(axis=1).mean():.2f}")

    # Diversity check — how many users have all-zero slices per type
    att_zero = (user_features[:, :NUM_TAGS].sum(axis=1)        == 0).sum()
    int_zero = (user_features[:, NUM_TAGS:2*NUM_TAGS].sum(axis=1) == 0).sum()
    blk_zero = (user_features[:, 2*NUM_TAGS:].sum(axis=1)      == 0).sum()
    print(f"\n  Users with no attended signal:   {att_zero:>5} ({att_zero/NUM_USERS*100:.1f}%)")
    print(f"  Users with no interested signal: {int_zero:>5} ({int_zero/NUM_USERS*100:.1f}%)")
    print(f"  Users with no blocked signal:    {blk_zero:>5} ({blk_zero/NUM_USERS*100:.1f}%)")

    # Triplet margin sanity check
    u_att  = user_features[triplets[:, 0], :NUM_TAGS]
    pos_t  = event_tags[triplets[:, 1]]
    neg_t  = event_tags[triplets[:, 2]]
    margin = (u_att * pos_t).sum(axis=1) - (u_att * neg_t).sum(axis=1)
    print(f"\n  Triplet margin (pos_sim - neg_sim):")
    print(f"    mean={margin.mean():.4f}  |  >0: {(margin > 0).mean()*100:.1f}%")

    print(f"\nFiles saved to: {out.resolve()}")


if __name__ == "__main__":
    main()