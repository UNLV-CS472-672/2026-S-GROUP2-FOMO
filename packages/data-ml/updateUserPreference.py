import os
import numpy as np

from convex import ConvexClient
from dotenv import load_dotenv

load_dotenv()
CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
client = ConvexClient(CONVEX_CLOUD_URL)

# Controls how quickly scores saturate toward 1
ALPHA = 1.0

# Baseline count for every tag
BETA = 0.5


def get_user_event_multihot(user_ids: list[str]) -> dict[str, np.ndarray]:
    """
    Builds a matrix for each user passed in:
    shape = (num_events_attended, num_tags)

    Each row is one attended event
    Each column is a tag
    Value = 1 if event has that tag, else 0
    """

    tags = client.query("data_ml/universal:queryAll", {"table_name": "tags"})
    tag_id_to_idx = {tag["_id"]: i for i, tag in enumerate(tags)}
    num_tags = len(tag_id_to_idx)

    result: dict[str, np.ndarray] = {}

    for user_id in user_ids:
        # Get the events this user has attended
        user_events = client.query("data_ml/updateUserPreferences:getByUserId", {"userId": user_id})
        event_ids = [row["eventId"] for row in user_events]

        mat : np.ndarray = np.zeros((len(event_ids), num_tags), dtype=np.float32)

        # Get tags associated with the events and create a onehot of the tags for the event
        for i, event_id in enumerate(event_ids):
            event_tags = client.query("data_ml/updateUserPreferences:getByEventId", {"eventId": event_id})
            for row in event_tags:
                tag_id = row["tagId"]
                if tag_id in tag_id_to_idx:
                    mat[i, tag_id_to_idx[tag_id]] = 1.0

        result[user_id] = mat

    return result


def build_user_tag_weights(user_tag_counts: dict[str, np.ndarray], alpha: float = ALPHA, beta: float = BETA) -> dict[str, np.ndarray]:
    """
        Converts per-user event-tag matrices into final tag preference weights.
        shape = (num_tags,)
    """
    user_preference_weights : dict[str, np.ndarray] = {}
    for user_id, mat in user_tag_counts.items():
        if mat.ndim != 2:
            raise ValueError(f"Expected 2D matrix for user {user_id}, got shape {mat.shape}")

        if np.any(mat < 0):
            raise ValueError("Matrix values cannot be negative")

        num_tags = mat.shape[1]

        # If user has attended no events
        if mat.shape[0] == 0:
            tag_weights = np.zeros(num_tags, dtype=np.float32)
        else:
            row_sums = mat.sum(axis=1, keepdims=True)

            # Prevent divide by 0
            row_sums[row_sums == 0] = 1.0

            normalized_weights = mat / row_sums
            tag_weights = normalized_weights.sum(axis=0)

        adjusted_counts = tag_weights + beta

        # Bounds the weights from [0, 1)
        bounded_weights = adjusted_counts / (adjusted_counts + alpha)

        user_preference_weights[user_id] = bounded_weights

    return user_preference_weights


def main(users: list[str]):
    user_event_multihot = get_user_event_multihot(USERS)

    user_preference_weights = build_user_tag_weights(user_event_multihot)

    print(user_preference_weights)


USERS = ['k57e25ntng6swp9n9m4qrpxm8x83rce6', 'k57256e442mxyg18bgazjnrr7983r5de']

if __name__ == "__main__":
    main(USERS)



