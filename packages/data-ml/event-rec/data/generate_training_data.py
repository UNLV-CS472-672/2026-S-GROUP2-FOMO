"""
Generates realistic training data for the FOMO Two-Tower recommendation model.

Output files:
  - user_tag_weights.npy   : shape (num_users, num_tags)  float32
  - event_tag_multihot.npy : shape (num_events, num_tags) float32
  - triplets.npy           : shape (N, 3) int32  [user_idx, pos_event_idx, neg_event_idx]
  - tag_index.json         : {tag_name: col_index}

Noise model:
  Each persona has three tiers of event attendance:
    primary   — core interests, attended often        → high tag weights
    secondary — genuine side interests, sometimes     → medium tag weights
    noise     — off-persona, attended rarely (1-2x)  → low but nonzero weights

  This mirrors real behavior: a party/concert person might go to one anime
  convention because a friend dragged them. That still shows up in their weight
  vector as a small nonzero value — it just won't dominate the signal.

Formula matches updateUserPreferences.py exactly:
  bounded = 1 - exp(-(tag_weights + prior + BETA) / TAU)
  BETA=0.15, TAU=1.25
"""

import json
import random
import numpy as np
from pathlib import Path


# ── 1. Tag vocabulary ──────────────────────────────────────────────────────────

TAGS = [
    "games", "fits", "culture", "thrift", "clothes", "chill", "r&b",
    "convention", "drink", "insightful", "wild", "chinatown", "birthday",
    "anime", "vendors", "college", "party", "art", "concert", "comics",
    "conference", "panel", "fair", "rap", "study", "food", "music",
]
NUM_TAGS = len(TAGS)
TAG_IDX  = {t: i for i, t in enumerate(TAGS)}


# ── 2. Event archetypes ────────────────────────────────────────────────────────

EVENT_ARCHETYPES = [
    # (name, required_tags, optional_tags, optional_prob)
    ("rap_concert",      ["concert", "rap", "music"],           ["wild", "drink", "party"],          0.6),
    ("rb_concert",       ["concert", "r&b", "music"],           ["chill", "drink", "party"],         0.6),
    ("anime_convention", ["convention", "anime", "comics"],     ["vendors", "art", "games"],         0.7),
    ("gaming_meetup",    ["games"],                              ["anime", "comics", "wild"],         0.5),
    ("art_fair",         ["art", "fair", "vendors"],            ["culture", "food", "insightful"],   0.6),
    ("thrift_market",    ["thrift", "vendors", "clothes"],      ["fair", "food", "fits"],            0.7),
    ("college_party",    ["party", "college"],                  ["drink", "wild", "music"],          0.8),
    ("birthday_party",   ["birthday", "party"],                 ["drink", "food", "music", "wild"],  0.7),
    ("food_festival",    ["food", "fair", "vendors"],           ["drink", "culture", "music"],       0.6),
    ("study_group",      ["study", "college"],                  ["insightful", "chill"],             0.6),
    ("conference_panel", ["conference", "panel", "insightful"], ["college", "culture", "study"],     0.5),
    ("chinatown_event",  ["chinatown", "culture", "food"],      ["vendors", "art", "fair"],          0.6),
    ("fashion_show",     ["fits", "clothes", "art"],            ["culture", "thrift", "party"],      0.5),
    ("chill_hangout",    ["chill"],                             ["food", "drink", "music", "r&b"],   0.6),
    ("rap_cypher",       ["rap", "wild"],                       ["music", "college", "party"],       0.6),
    ("comics_expo",      ["comics", "convention", "vendors"],   ["games", "anime", "art"],           0.7),
    ("culture_fest",     ["culture", "fair"],                   ["food", "music", "art", "chinatown"], 0.65),
    ("open_mic",         ["music", "art"],                      ["r&b", "rap", "chill", "party"],   0.6),
    ("night_out",        ["drink", "wild", "party"],            ["music", "r&b", "rap"],             0.7),
    ("campus_fair",      ["college", "fair", "vendors"],        ["study", "food", "games"],          0.6),
]


def generate_event(archetype) -> np.ndarray:
    _, required, optional, prob = archetype
    v = np.zeros(NUM_TAGS, dtype=np.float32)
    for tag in required:
        v[TAG_IDX[tag]] = 1.0
    for tag in optional:
        if random.random() < prob:
            v[TAG_IDX[tag]] = 1.0
    return v


# ── 3. User personas ───────────────────────────────────────────────────────────
#
# (name, primary_tags, secondary_tags, noise_tags, n_primary, n_secondary, n_noise)
#
# n_noise is kept small (1-2 events) so those tags get a real but low weight.
# The noise_tags are intentionally off-persona — a party person goes to one
# anime event, a gamer stumbles into a food festival, etc.

USER_PERSONAS = [
    ("music_head",
        ["concert", "music", "r&b", "rap"],
        ["party", "drink", "chill"],
        ["anime", "study", "conference"],
        12, 5, 2),

    ("anime_fan",
        ["anime", "comics", "convention", "games"],
        ["art", "vendors"],
        ["party", "concert", "food"],
        14, 4, 2),

    ("college_student",
        ["study", "college", "insightful"],
        ["food", "chill", "party"],
        ["concert", "thrift", "games"],
        10, 6, 2),

    ("party_animal",
        ["party", "drink", "wild"],
        ["music", "rap", "r&b"],
        ["anime", "study", "art"],
        15, 5, 2),

    ("art_lover",
        ["art", "culture", "insightful"],
        ["fair", "vendors", "food"],
        ["party", "games", "rap"],
        11, 5, 2),

    ("streetwear_fan",
        ["fits", "clothes", "thrift"],
        ["culture", "art", "vendors"],
        ["concert", "party", "anime"],
        12, 4, 2),

    ("foodie",
        ["food", "fair", "vendors"],
        ["culture", "drink", "music"],
        ["games", "study", "convention"],
        13, 5, 2),

    ("gamer",
        ["games", "anime", "comics"],
        ["convention", "wild", "chill"],
        ["music", "food", "party"],
        12, 4, 2),

    ("hip_hop_head",
        ["rap", "concert", "music"],
        ["r&b", "wild", "party"],
        ["anime", "art", "study"],
        13, 5, 2),

    ("culture_vulture",
        ["culture", "chinatown", "art"],
        ["food", "insightful", "fair"],
        ["party", "games", "concert"],
        11, 5, 2),

    ("networker",
        ["conference", "panel", "insightful"],
        ["college", "study", "culture"],
        ["party", "music", "anime"],
        10, 4, 2),

    ("night_crawler",
        ["drink", "wild", "party"],
        ["music", "concert", "rap"],
        ["anime", "study", "art"],
        14, 4, 2),

    ("chill_vibe",
        ["chill", "r&b", "music"],
        ["food", "drink", "art"],
        ["games", "convention", "study"],
        10, 5, 2),

    ("campus_org",
        ["college", "fair", "panel"],
        ["study", "conference", "vendors"],
        ["concert", "anime", "party"],
        11, 4, 2),

    ("vendor_hopper",
        ["vendors", "thrift", "fair"],
        ["food", "art", "culture"],
        ["concert", "games", "party"],
        13, 5, 2),
]


# ── 4. Weight formula (mirrors updateUserPreferences.py exactly) ───────────────

BETA = 0.15
TAU  = 1.25


def build_user_weight_from_matrix(mat: np.ndarray, prior: np.ndarray | None = None) -> np.ndarray:
    """
    Exact replica of build_user_tag_weights in updateUserPreferences.py.
    bounded = 1 - exp(-(tag_weights + prior + BETA) / TAU)
    """
    if prior is None:
        prior = np.zeros(NUM_TAGS, dtype=np.float32)

    if mat.shape[0] == 0:
        tag_weights = np.zeros(NUM_TAGS, dtype=np.float32)
    else:
        row_sums = mat.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1.0
        normalized  = mat / row_sums
        tag_weights = normalized.sum(axis=0)

    tag_weights = tag_weights + prior
    return (1.0 - np.exp(-(tag_weights + BETA) / TAU)).astype(np.float32)


# ── 5. Simulate attendance ─────────────────────────────────────────────────────

def _score_archetype(arch, tag_set: set) -> int:
    return len(set(arch[1]) & tag_set)


def simulate_attended_events(persona) -> np.ndarray:
    _, primary_tags, secondary_tags, noise_tags, n_primary, n_secondary, n_noise = persona

    primary_set   = set(primary_tags)
    secondary_set = set(secondary_tags)
    noise_set     = set(noise_tags)

    by_primary   = sorted(EVENT_ARCHETYPES, key=lambda a: _score_archetype(a, primary_set),   reverse=True)
    by_secondary = sorted(EVENT_ARCHETYPES, key=lambda a: _score_archetype(a, secondary_set), reverse=True)
    by_noise     = sorted(EVENT_ARCHETYPES, key=lambda a: _score_archetype(a, noise_set),     reverse=True)

    top_primary   = by_primary[:6]
    top_secondary = by_secondary[:6]
    top_noise     = by_noise[:4]

    rows = []
    for _ in range(n_primary):
        rows.append(generate_event(random.choice(top_primary)))
    for _ in range(n_secondary):
        rows.append(generate_event(random.choice(top_secondary)))
    # Noise: off-persona events attended rarely → low but nonzero tag weights
    for _ in range(n_noise):
        rows.append(generate_event(random.choice(top_noise)))

    return np.array(rows, dtype=np.float32)


# ── 6. Generate users ──────────────────────────────────────────────────────────

NUM_USERS = 10000


def generate_users():
    user_weights   = []
    persona_labels = []

    for i in range(NUM_USERS):
        persona = USER_PERSONAS[i % len(USER_PERSONAS)]

        jitter = random.uniform(0.75, 1.3)
        jittered = (
            persona[0],
            persona[1], persona[2], persona[3],
            max(3, int(persona[4] * jitter)),
            max(1, int(persona[5] * jitter)),
            max(1, int(persona[6] * jitter)),
        )

        mat    = simulate_attended_events(jittered)
        weight = build_user_weight_from_matrix(mat)
        user_weights.append(weight)
        persona_labels.append(i % len(USER_PERSONAS))

    return np.array(user_weights, dtype=np.float32), persona_labels


# ── 7. Generate events ─────────────────────────────────────────────────────────

NUM_EVENTS = 6000


def generate_events() -> np.ndarray:
    events = []
    for _ in range(NUM_EVENTS):
        arch = random.choice(EVENT_ARCHETYPES)
        events.append(generate_event(arch))
    return np.array(events, dtype=np.float32)


# ── 8. Mine BPR triplets ───────────────────────────────────────────────────────

TRIPLETS_PER_USER = 40   # 800 × 15 = up to 12,000 triplets


def cosine_sim_matrix(user_weights: np.ndarray, event_tags: np.ndarray) -> np.ndarray:
    u_norm = user_weights / (np.linalg.norm(user_weights, axis=1, keepdims=True) + 1e-8)
    e_norm = event_tags   / (np.linalg.norm(event_tags,   axis=1, keepdims=True) + 1e-8)
    return u_norm @ e_norm.T


def mine_triplets(user_weights: np.ndarray, event_tags: np.ndarray) -> np.ndarray:
    sim      = cosine_sim_matrix(user_weights, event_tags)
    triplets = []

    for u_idx in range(len(user_weights)):
        scores = sim[u_idx]
        ranked = np.argsort(scores)[::-1]

        pos_pool      = ranked[:30].tolist()
        hard_neg_pool = ranked[40:150].tolist()
        easy_neg_pool = ranked[int(0.75 * len(ranked)):].tolist()

        for _ in range(TRIPLETS_PER_USER):
            pos_idx = random.choice(pos_pool)
            neg_idx = (random.choice(hard_neg_pool)
                       if random.random() < 0.6
                       else random.choice(easy_neg_pool))

            if scores[pos_idx] > scores[neg_idx]:
                triplets.append([u_idx, pos_idx, neg_idx])

    return np.array(triplets, dtype=np.int32)


# ── 9. Main ────────────────────────────────────────────────────────────────────

def main():
    random.seed(42)
    np.random.seed(42)

    out = Path("training/training_data")
    out.mkdir(exist_ok=True)

    print("Generating users...")
    user_weights, persona_labels = generate_users()
    print(f"  {user_weights.shape[0]} users, {NUM_TAGS} tags")

    print("Generating events...")
    event_tags = generate_events()
    print(f"  {event_tags.shape[0]} events, {NUM_TAGS} tags")

    print("Mining triplets...")
    triplets = mine_triplets(user_weights, event_tags)
    print(f"  {len(triplets):,} triplets")

    np.save(out / "user_tag_weights.npy",   user_weights)
    np.save(out / "event_tag_multihot.npy", event_tags)
    np.save(out / "triplets.npy",           triplets)
    with open(out / "tag_index.json", "w") as f:
        json.dump(TAG_IDX, f, indent=2)

    print("\n── Dataset Stats ─────────────────────────────────────────")
    print(f"  Users:    {user_weights.shape[0]:>6,}")
    print(f"  Events:   {event_tags.shape[0]:>6,}")
    print(f"  Triplets: {len(triplets):>6,}")
    print(f"  Tags:     {NUM_TAGS}")
    print(f"\n  Avg tags per event:  {event_tags.sum(axis=1).mean():.2f}")
    print(f"  Avg user weight sum: {user_weights.sum(axis=1).mean():.2f}")

    sims     = (user_weights[triplets[:, 0]] * event_tags[triplets[:, 1]]).sum(axis=1)
    neg_sims = (user_weights[triplets[:, 0]] * event_tags[triplets[:, 2]]).sum(axis=1)
    margin   = sims - neg_sims
    print(f"\n  Triplet margin (pos_sim - neg_sim):")
    print(f"    mean={margin.mean():.4f}  |  >0={(margin > 0).mean()*100:.1f}%")

    # Sanity check: show that noise is reflected but low for one music_head user
    music_head_idx = next(i for i, l in enumerate(persona_labels) if l == 0)
    w = user_weights[music_head_idx]
    top5       = sorted(TAG_IDX, key=lambda t: w[TAG_IDX[t]], reverse=True)[:5]
    noise_tags = USER_PERSONAS[0][3]
    print(f"\n  Sample music_head user (noise check):")
    print(f"    Top 5 tags:  {[(t, round(float(w[TAG_IDX[t]]), 3)) for t in top5]}")
    print(f"    Noise tags:  {[(t, round(float(w[TAG_IDX[t]]), 3)) for t in noise_tags]}")
    print(f"    (noise weights are nonzero but clearly lower than core interests)")
    print(f"\nFiles saved to: {out.resolve()}")


if __name__ == "__main__":
    main()