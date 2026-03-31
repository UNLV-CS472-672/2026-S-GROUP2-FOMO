"""
Generates realistic training data for the FOMO Two-Tower recommendation model.

Output files:
  - user_tag_weights.npy   : shape (num_users, num_tags)  float32
  - event_tag_multihot.npy : shape (num_events, num_tags) float32
  - triplets.npy           : shape (N, 3) int32  [user_idx, pos_event_idx, neg_event_idx]
  - tag_index.json         : {tag_name: col_index}

Design goals:
  - Users have coherent interest clusters (not random noise)
  - Events have realistic tag co-occurrences (a concert also has music/r&b/rap tags, etc.)
  - Positive events are semantically close to the user's interest vector
  - Negative events are drawn from low-affinity regions (hard negatives mixed with easy ones)
"""

import json
import random
import numpy as np
from pathlib import Path

# ── 1. Tag vocabulary (matches your Convex DB screenshot) ─────────────────────

TAGS = [
    "games", "fits", "culture", "thrift", "clothes", "chill", "r&b",
    "convention", "drink", "insightful", "wild", "chinatown", "birthday",
    "anime", "vendors", "college", "party", "art", "concert", "comics",
    "conference", "panel", "fair", "rap", "study", "food", "music",
]
NUM_TAGS = len(TAGS)
TAG_IDX = {t: i for i, t in enumerate(TAGS)}

def t(*names) -> np.ndarray:
    """Return a multi-hot vector for the given tag names."""
    v = np.zeros(NUM_TAGS, dtype=np.float32)
    for n in names:
        v[TAG_IDX[n]] = 1.0
    return v


# ── 2. Event archetypes ────────────────────────────────────────────────────────
# Each archetype is (base_tags, optional_tags, weight_of_optional)
# We sample from optional_tags with given probability to add variety.

EVENT_ARCHETYPES = [
    # (name, required_tags, optional_tags, optional_prob)
    ("rap_concert",      ["concert", "rap", "music"],              ["wild", "drink", "party"],     0.6),
    ("rb_concert",       ["concert", "r&b", "music"],              ["chill", "drink", "party"],    0.6),
    ("anime_convention", ["convention", "anime", "comics"],        ["vendors", "art", "games"],    0.7),
    ("gaming_meetup",    ["games"],                                 ["anime", "comics", "wild"],    0.5),
    ("art_fair",         ["art", "fair", "vendors"],               ["culture", "food", "insightful"], 0.6),
    ("thrift_market",    ["thrift", "vendors", "clothes"],         ["fair", "food", "fits"],       0.7),
    ("college_party",    ["party", "college"],                     ["drink", "wild", "music"],     0.8),
    ("birthday_party",   ["birthday", "party"],                    ["drink", "food", "music", "wild"], 0.7),
    ("food_festival",    ["food", "fair", "vendors"],              ["drink", "culture", "music"],  0.6),
    ("study_group",      ["study", "college"],                     ["insightful", "chill"],        0.6),
    ("conference_panel", ["conference", "panel", "insightful"],    ["college", "culture", "study"], 0.5),
    ("chinatown_event",  ["chinatown", "culture", "food"],         ["vendors", "art", "fair"],     0.6),
    ("fashion_show",     ["fits", "clothes", "art"],               ["culture", "thrift", "party"], 0.5),
    ("chill_hangout",    ["chill"],                                 ["food", "drink", "music", "r&b"], 0.6),
    ("rap_cypher",       ["rap", "wild"],                          ["music", "college", "party"],  0.6),
    ("comics_expo",      ["comics", "convention", "vendors"],      ["games", "anime", "art"],      0.7),
    ("culture_fest",     ["culture", "fair"],                      ["food", "music", "art", "chinatown"], 0.65),
    ("open_mic",         ["music", "art"],                         ["r&b", "rap", "chill", "party"], 0.6),
    ("night_out",        ["drink", "wild", "party"],               ["music", "r&b", "rap"],        0.7),
    ("campus_fair",      ["college", "fair", "vendors"],           ["study", "food", "games"],     0.6),
]


def generate_event(archetype) -> np.ndarray:
    name, required, optional, prob = archetype
    v = np.zeros(NUM_TAGS, dtype=np.float32)
    for tag in required:
        v[TAG_IDX[tag]] = 1.0
    for tag in optional:
        if random.random() < prob:
            v[TAG_IDX[tag]] = 1.0
    return v


# ── 3. User persona definitions ───────────────────────────────────────────────
# Each persona has a primary interest cluster and secondary interests.
# We'll use these to generate realistic smoothed tag weights via the same
# Laplace-style formula as updateUserPreferences.py

ALPHA = 1.0
BETA  = 0.5

def laplace_weight(tag_counts: np.ndarray) -> np.ndarray:
    """Mirror of build_user_tag_weights from updateUserPreference.py."""
    adjusted = tag_counts + BETA
    return adjusted / (adjusted + ALPHA)


USER_PERSONAS = [
    # (name, primary_tags, secondary_tags, primary_events_attended, secondary_events_attended)
    ("music_head",       ["concert", "music", "r&b", "rap"],       ["party", "drink", "chill"],           12, 5),
    ("anime_fan",        ["anime", "comics", "convention", "games"],["art", "vendors"],                    14, 4),
    ("college_student",  ["study", "college", "insightful"],        ["food", "chill", "party"],             10, 6),
    ("party_animal",     ["party", "drink", "wild"],                ["music", "rap", "r&b"],                15, 5),
    ("art_lover",        ["art", "culture", "insightful"],          ["fair", "vendors", "food"],            11, 5),
    ("streetwear_fan",   ["fits", "clothes", "thrift"],             ["culture", "art", "vendors"],          12, 4),
    ("foodie",           ["food", "fair", "vendors"],               ["culture", "drink", "music"],          13, 5),
    ("gamer",            ["games", "anime", "comics"],              ["convention", "wild", "chill"],        12, 4),
    ("hip_hop_head",     ["rap", "concert", "music"],               ["r&b", "wild", "party"],               13, 5),
    ("culture_vulture",  ["culture", "chinatown", "art"],           ["food", "insightful", "fair"],         11, 5),
    ("networker",        ["conference", "panel", "insightful"],     ["college", "study", "culture"],        10, 4),
    ("night_crawler",    ["drink", "wild", "party"],                ["music", "concert", "rap"],            14, 4),
    ("chill_vibe",       ["chill", "r&b", "music"],                 ["food", "drink", "art"],               10, 5),
    ("campus_org",       ["college", "fair", "panel"],              ["study", "conference", "vendors"],     11, 4),
    ("vendor_hopper",    ["vendors", "thrift", "fair"],             ["food", "art", "culture"],             13, 5),
]


def simulate_attended_events(persona, all_events_by_archetype) -> np.ndarray:
    """
    Simulate the multi-hot attendance matrix for a user persona.
    Returns shape: (num_attended, NUM_TAGS)
    """
    _, primary_tags, secondary_tags, n_primary, n_secondary = persona

    primary_set = set(primary_tags)
    secondary_set = set(secondary_tags)

    rows = []

    # Score each archetype for relevance to this persona
    def archetype_score(arch):
        required_set = set(arch[1])
        overlap_primary = len(required_set & primary_set)
        overlap_secondary = len(required_set & secondary_set)
        return overlap_primary * 3 + overlap_secondary

    scored = sorted(EVENT_ARCHETYPES, key=archetype_score, reverse=True)
    top_archetypes = scored[:7]   # most relevant
    rest_archetypes = scored[7:]  # less relevant

    # Primary attended events
    for _ in range(n_primary):
        arch = random.choice(top_archetypes)
        rows.append(generate_event(arch))

    # Secondary attended events
    for _ in range(n_secondary):
        arch = random.choice(rest_archetypes[:6])
        rows.append(generate_event(arch))

    return np.array(rows, dtype=np.float32) if rows else np.zeros((0, NUM_TAGS), dtype=np.float32)


def build_user_weight_from_matrix(mat: np.ndarray) -> np.ndarray:
    """Replicates updateUserPreferences.py build_user_tag_weights."""
    if mat.shape[0] == 0:
        return np.zeros(NUM_TAGS, dtype=np.float32)

    row_sums = mat.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1.0
    normalized = mat / row_sums
    tag_weights = normalized.sum(axis=0)

    adjusted = tag_weights + BETA
    return (adjusted / (adjusted + ALPHA)).astype(np.float32)


# ── 4. Generate users ─────────────────────────────────────────────────────────

NUM_USERS = 800   # varied personas → plenty of 10k+ triplets

def generate_users():
    user_weights = []
    user_persona_labels = []  # track which persona each user is for triplet mining

    for i in range(NUM_USERS):
        persona = USER_PERSONAS[i % len(USER_PERSONAS)]
        # Add noise by randomly varying attendance counts slightly
        noise_factor = random.uniform(0.7, 1.3)
        noisy_persona = (
            persona[0],
            persona[1],
            persona[2],
            max(3, int(persona[3] * noise_factor)),
            max(1, int(persona[4] * noise_factor)),
        )
        mat = simulate_attended_events(noisy_persona, EVENT_ARCHETYPES)
        weight = build_user_weight_from_matrix(mat)
        user_weights.append(weight)
        user_persona_labels.append(i % len(USER_PERSONAS))

    return np.array(user_weights, dtype=np.float32), user_persona_labels


# ── 5. Generate events ────────────────────────────────────────────────────────

NUM_EVENTS = 2000

def generate_events():
    events = []
    for _ in range(NUM_EVENTS):
        arch = random.choice(EVENT_ARCHETYPES)
        events.append(generate_event(arch))
    return np.array(events, dtype=np.float32)


# ── 6. Mine BPR triplets ──────────────────────────────────────────────────────
# For each user, find positive events (high cosine sim to user weight vector)
# and negative events (low cosine sim). Mix hard negatives (mid-range sim)
# with easy negatives (low sim) for better training signal.

def cosine_sim_matrix(user_weights: np.ndarray, event_tags: np.ndarray) -> np.ndarray:
    """
    Returns shape (num_users, num_events).
    Both inputs are already normalized-ish but not unit vectors, so we normalize.
    """
    u_norm = user_weights / (np.linalg.norm(user_weights, axis=1, keepdims=True) + 1e-8)
    e_norm = event_tags / (np.linalg.norm(event_tags, axis=1, keepdims=True) + 1e-8)
    return u_norm @ e_norm.T


TRIPLETS_PER_USER = 15   # yields 800 * 15 = 12,000 triplets

def mine_triplets(user_weights: np.ndarray, event_tags: np.ndarray) -> np.ndarray:
    sim = cosine_sim_matrix(user_weights, event_tags)   # (num_users, num_events)
    triplets = []

    for u_idx in range(len(user_weights)):
        scores = sim[u_idx]
        sorted_indices = np.argsort(scores)[::-1]  # descending

        top_k = 30
        pos_pool = sorted_indices[:top_k].tolist()

        # Hard negatives: rank 40–150 (some overlap possible, gives hard training signal)
        hard_neg_pool = sorted_indices[40:150].tolist()
        # Easy negatives: bottom 25%
        easy_neg_pool = sorted_indices[int(0.75 * len(sorted_indices)):].tolist()

        for _ in range(TRIPLETS_PER_USER):
            pos_idx = random.choice(pos_pool)

            # 60% hard negatives, 40% easy
            if random.random() < 0.6:
                neg_idx = random.choice(hard_neg_pool)
            else:
                neg_idx = random.choice(easy_neg_pool)

            # Ensure pos is actually better than neg for this user
            if scores[pos_idx] > scores[neg_idx]:
                triplets.append([u_idx, pos_idx, neg_idx])

    return np.array(triplets, dtype=np.int32)


# ── 7. Main ───────────────────────────────────────────────────────────────────

def main():
    random.seed(42)
    np.random.seed(42)

    out = Path("/home/claude/training_data")
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

    # Save
    np.save(out / "user_tag_weights.npy", user_weights)
    np.save(out / "event_tag_multihot.npy", event_tags)
    np.save(out / "triplets.npy", triplets)

    with open(out / "tag_index.json", "w") as f:
        json.dump(TAG_IDX, f, indent=2)

    # ── Stats ─────────────────────────────────────────────────────────────────
    print("\n── Dataset Stats ─────────────────────────────────────────")
    print(f"  Users:        {user_weights.shape[0]:>6,}")
    print(f"  Events:       {event_tags.shape[0]:>6,}")
    print(f"  Triplets:     {len(triplets):>6,}")
    print(f"  Tags:         {NUM_TAGS}")
    print(f"\n  user_tag_weights.npy   → {user_weights.shape}")
    print(f"  event_tag_multihot.npy → {event_tags.shape}")
    print(f"  triplets.npy           → {triplets.shape}  [user_idx, pos_idx, neg_idx]")
    print(f"\n  Avg tags per event:    {event_tags.sum(axis=1).mean():.2f}")
    print(f"  Avg user weight sum:   {user_weights.sum(axis=1).mean():.2f}")

    # Sample triplet sanity check
    sims = (user_weights[triplets[:, 0]] * event_tags[triplets[:, 1]]).sum(axis=1)
    neg_sims = (user_weights[triplets[:, 0]] * event_tags[triplets[:, 2]]).sum(axis=1)
    margin = sims - neg_sims
    print(f"\n  Triplet margin (pos_sim - neg_sim):")
    print(f"    mean = {margin.mean():.4f}  |  >0 = {(margin > 0).mean()*100:.1f}%")
    print(f"\nFiles saved to: {out.resolve()}")


if __name__ == "__main__":
    main()
