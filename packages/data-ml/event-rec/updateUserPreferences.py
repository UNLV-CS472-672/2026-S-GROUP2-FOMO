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

# Baseline count for every tag
BETA = 0.15
TAU = 1.0

NUM_TAGS = 0
TAG_ID_TO_IDX = {}


def get_user_event_multihot(user_ids: list[str]) -> dict[str, np.ndarray]:
    """
    Builds a matrix for each user passed in:
    shape = (num_events_attended, num_tags)

    Each row is one attended event
    Each column is a tag
    Value = 1 if event has that tag, else 0
    """

    global NUM_TAGS, TAG_ID_TO_IDX

    tags = get_client().query("data_ml/universal:queryAll", {"table_name": "tags"})
    TAG_ID_TO_IDX = {tag["_id"]: i for i, tag in enumerate(tags)}
    NUM_TAGS = len(TAG_ID_TO_IDX)

    # Checks if we want all users or if users are already passed in
    if len(user_ids) == 1 and user_ids[0] == "ALL":
        all_users = get_client().query("data_ml/universal:queryAll", {"table_name": "users"})
        resolved_user_ids = [row["_id"] for row in all_users]
    else:
        resolved_user_ids = user_ids

    result: dict[str, np.ndarray] = {}

    for user_id in resolved_user_ids:
        # Get the events this user has attended
        user_events = get_client().query("data_ml/eventRec:getByUserId", {"userId": user_id})
        event_ids = [row["eventId"] for row in user_events]

        mat : np.ndarray = np.zeros((len(event_ids), NUM_TAGS), dtype=np.float32)

        # Get tags associated with the events and create a onehot of the tags for the event
        for i, event_id in enumerate(event_ids):
            event_tags = get_client().query("data_ml/eventRec:getByEventId", {"eventId": event_id})
            for row in event_tags:
                tag_id = row["tagId"]
                if tag_id in TAG_ID_TO_IDX:
                    mat[i, TAG_ID_TO_IDX[tag_id]] = 1.0

        result[user_id] = mat

    return result


def get_initial_preferences(users: dict[str, np.ndarray]) -> dict[str, np.ndarray]:
    """
    Builds initial preference weights for users passed in
    shape = (num_tags,)

    Each user will input what tags they prefer on account creation
    and those initial preferences are used here to calculate prior weights.
    """

    initial_user_preference_weights : dict[str, np.ndarray] = {}
    for user_id in users:
        initial_user_preferences = get_client().query("data_ml/eventRec:getPreferredTagsByUserId", {"userId": user_id})

        initial_user_preference_weights[user_id] = np.zeros(NUM_TAGS, dtype=np.float32)

        if initial_user_preferences is None:
            continue

        for tag_id in initial_user_preferences['tagIds']:
            initial_user_preference_weights[user_id][TAG_ID_TO_IDX[tag_id]] = 0.5

    return initial_user_preference_weights


def build_user_tag_weights(user_preference_weights : dict[str, np.ndarray], user_tag_counts: dict[str, np.ndarray], tau: float = TAU, beta: float = BETA) -> dict[str, np.ndarray]:
    """
        Converts per-user event-tag matrices into final tag preference weights.
        shape = (num_tags,)
    """
    for user_id, mat in user_tag_counts.items():
        if mat.ndim != 2:
            raise ValueError(f"Expected 2D matrix for user {user_id}, got shape {mat.shape}")

        if np.any(mat < 0):
            raise ValueError("Matrix values cannot be negative")

        # If user has attended no events
        if mat.shape[0] == 0:
            tag_weights = np.zeros(NUM_TAGS, dtype=np.float32)
        else:
            row_sums = mat.sum(axis=1, keepdims=True)

            # Prevent divide by 0
            row_sums[row_sums == 0] = 1.0

            normalized_weights = mat / row_sums
            tag_weights = normalized_weights.sum(axis=0)

        # Add priors
        tag_weights = tag_weights + user_preference_weights[user_id]

        # Bounds the weights from [0, 1)
        bounded_weights = 1.0 - np.exp(-(tag_weights + beta) / tau)

        user_preference_weights[user_id] = bounded_weights

    return user_preference_weights


def main(users: list[str], update_db: bool) -> None:
    user_event_multihot = get_user_event_multihot(users)

    initial_user_preference_weights = get_initial_preferences(user_event_multihot)

    user_preference_weights = build_user_tag_weights(initial_user_preference_weights, user_event_multihot)

    if update_db:
        for user_id, weights in user_preference_weights.items():
            get_client().mutation(
                "data_ml/eventRec:upsertUserTagWeights",
                {
                    "userId": user_id,
                    "weights": weights.tolist()
                }
            )
    else:
        print(user_preference_weights)


USERS = ['ALL']
UPDATE_DB = True

if __name__ == "__main__":
    main(USERS, UPDATE_DB)



