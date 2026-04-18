import os
import numpy as np

from convex import ConvexClient
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")

client: Optional[ConvexClient] = (
    ConvexClient(CONVEX_CLOUD_URL) if CONVEX_CLOUD_URL else None
)

def get_client() -> ConvexClient:
    if client is None:
        raise RuntimeError("ConvexClient not initialized")
    return client


BETA = 0.10
TAU  = 1.25

NUM_TAGS = 0
TAG_ID_TO_IDX: dict[str, int] = {}


# ── Tag/event helpers

def init_tags() -> None:
    """init tags"""
    global NUM_TAGS, TAG_ID_TO_IDX
    tags = get_client().query("data_ml/universal:queryAll", {"table_name": "tags"})
    TAG_ID_TO_IDX = {tag["_id"]: i for i, tag in enumerate(tags)}
    NUM_TAGS = len(TAG_ID_TO_IDX)


def event_multihot(event_id: str) -> np.ndarray:
    """Returns a (num_tags,) binary vector for one event."""
    vec = np.zeros(NUM_TAGS, dtype=np.float32)
    event_tags = get_client().query("data_ml/eventRec:getByEventId", {"eventId": event_id})
    for row in event_tags:
        tag_id = row["tagId"]
        if tag_id in TAG_ID_TO_IDX:
            vec[TAG_ID_TO_IDX[tag_id]] = 1.0
    return vec


def build_matrix(event_ids: list[str]) -> np.ndarray:
    """multihot matrix for list of event IDs."""
    if not event_ids:
        return np.zeros((0, NUM_TAGS), dtype=np.float32)
    return np.array([event_multihot(eid) for eid in event_ids], dtype=np.float32)


# ── Weight formula

def build_weights(mat: np.ndarray, row_weight: float = 1.0) -> np.ndarray:
    """
    Converts an (n_events, num_tags) matrix into a (num_tags,) bounded weight vector.

    row_weight: scales each event's contribution before bounding.
      - attended: 1.0  (full signal)
      - interested: 0.5  (half signal)
      - blocked: 1.0  (full signal - strong negative preference)
    """
    if mat.shape[0] == 0:
        return np.zeros(NUM_TAGS, dtype=np.float32)

    row_sums = mat.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1.0
    normalized = mat / row_sums
    tag_weights = normalized.sum(axis=0) * row_weight

    return (1.0 - np.exp(-(tag_weights + BETA) / TAU)).astype(np.float32)


# ── Per-user feature building

def get_interaction_ids(user_id: str) -> tuple[list[str], list[str], list[str]]:
    """
    Returns rows from usersToEvents with fields:
    { eventId: str, interactionType: "attended" | "interested" | "blocked" }
    """
    interactions = get_client().query("data_ml/eventRec:getInteractionsByUserId", {"userId": user_id})

    attended = [row["eventId"] for row in interactions if row["interactionType"] == "attended"]
    interested = [row["eventId"] for row in interactions if row["interactionType"] == "interested"]
    blocked = [row["eventId"] for row in interactions if row["interactionType"] == "blocked"]

    return attended, interested, blocked


def build_user_feature_vector(user_id: str) -> np.ndarray:
    """
    Builds full (3 * num_tags,) feature vector for one user:
      [attended_weights | interested_weights | blocked_weights]
    """

    # Get event ids for events the user has attended, was interested, and has blocked
    attended_ids, interested_ids, blocked_ids = get_interaction_ids(user_id)

    att_mat = build_matrix(attended_ids)
    int_mat = build_matrix(interested_ids)
    blk_mat = build_matrix(blocked_ids)

    att_weights = build_weights(att_mat,  row_weight=1.0)
    int_weights = build_weights(int_mat,  row_weight=0.5)
    blk_weights = build_weights(blk_mat,  row_weight=2.0)

    blk_weights = blk_weights

    # Cold Start preferences
    initial_prefs = get_client().query("data_ml/eventRec:getPreferredTagsByUserId", {"userId": user_id})

    if initial_prefs:
        prior = np.zeros(NUM_TAGS, dtype=np.float32)
        for tag_id in initial_prefs.get("tagIds", []):
            if tag_id in TAG_ID_TO_IDX:
                prior[TAG_ID_TO_IDX[tag_id]] = 0.5
        att_weights = np.clip(att_weights + prior * (1.0 - att_weights), 0.0, 1.0)

    return np.concatenate([att_weights, int_weights, blk_weights]).astype(np.float32)


# ── Main

def main(users: list[str], update_db: bool) -> None:
    init_tags()

    print(TAG_ID_TO_IDX)

    if len(users) == 1 and users[0] == "ALL":
        all_users = get_client().query("data_ml/universal:queryAll", {"table_name": "users"})
        users = [row["_id"] for row in all_users]

    user_feature_vectors: dict[str, np.ndarray] = {}
    for user_id in users:
        user_feature_vectors[user_id] = build_user_feature_vector(user_id)

    if update_db:
        for user_id, vec in user_feature_vectors.items():
            get_client().mutation("data_ml/eventRec:upsertUserTagWeights",{"userId":  user_id, "weights": vec.tolist()})
        print(f"Updated {len(user_feature_vectors)} users in Convex.")
    else:
        for user_id, vec in user_feature_vectors.items():
            att = vec[:NUM_TAGS]
            int_ = vec[NUM_TAGS: 2 * NUM_TAGS]
            blk = vec[2 * NUM_TAGS:]
            print(f"\nUser {user_id}:")
            print(f"  attended  weights (top 5): { sorted(enumerate(att), key=lambda x: -x[1])[:5] }")
            print(f"  interested weights (top 5): { sorted(enumerate(int_), key=lambda x: -x[1])[:5] }")
            print(f"  blocked   weights (top 5): { sorted(enumerate(blk), key=lambda x: -x[1])[:5] }")


USERS = ["ALL"]
UPDATE_DB = True

if __name__ == "__main__":
    main(USERS, UPDATE_DB)