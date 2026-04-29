import os
import numpy as np
from numpy.typing import NDArray

from dotenv import load_dotenv
from typing import Optional
from lib import queries


NUM_TAGS = 0
TAG_ID_TO_IDX: dict[str, int] = {}


def init_tags() -> None:
    """init tags"""
    global NUM_TAGS, TAG_ID_TO_IDX
    tags = queries.query_all("tags")
    TAG_ID_TO_IDX = {tag["_id"]: i for i, tag in enumerate(tags)}
    NUM_TAGS = len(TAG_ID_TO_IDX)


def event_multihot(event_id: str) -> NDArray[np.float32]:
    """Returns a (num_tags,) binary vector for one event."""
    vec = np.zeros(NUM_TAGS, dtype=np.float32)
    event_tags = queries.get_by_event_id(event_id)
    for row in event_tags:
        tag_id = row["tagId"]
        if tag_id in TAG_ID_TO_IDX:
            vec[TAG_ID_TO_IDX[tag_id]] = 1.0
    return vec


def build_matrix(event_ids: list[str]) -> NDArray[np.float32]:
    """multihot matrix for list of event IDs."""
    if not event_ids:
        return np.zeros((0, NUM_TAGS), dtype=np.float32)
    return np.array([event_multihot(eid) for eid in event_ids], dtype=np.float32)


def build_weights(
    mat: NDArray[np.float32], row_weight: float = 1.0
) -> NDArray[np.float32]:
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
    tag_weights: NDArray[np.float32] = normalized.sum(axis=0) * row_weight

    return tag_weights


#


def get_interaction_ids(
    user_id: str, user_last_updated: float
) -> tuple[list[str], list[str], list[str]]:
    """
    Returns rows from usersToEvents with fields:
    { eventId: str, interactionType: "going" | "interested" | "uninterested" }
    """
    
    if user_last_updated >= 0:
        interactions = queries.get_interactions_by_user_id(user_id, user_last_updated)
    else:
        interactions = queries.get_interactions_by_user_id(user_id)

    going = [row["eventId"] for row in interactions if row["status"] == "going"]
    interested = [
        row["eventId"] for row in interactions if row["status"] == "interested"
    ]
    uninterested = [
        row["eventId"] for row in interactions if row["status"] == "uninterested"
    ]

    return going, interested, uninterested


def build_user_feature_vector(user_id: str, last_updated: float | None = None, weights: list[float] | None = None) -> NDArray[np.float32]:
    """
    Builds full (3 * num_tags,) feature vector for one user:
      [going_weights | interested_weights | uninterested_weights]
    """
    if last_updated is not None and weights is not None:
        # passed in values
        user_last_updated = last_updated
        user_raw_weights_nd = np.array(weights, dtype=np.float32)
    else:
        # Didn't pass in weights or last_updated. Query for both
        user_weights_and_timestamp = queries.get_user_tag_weights_with_timestamp(user_id, NUM_TAGS)

        user_last_updated = float(user_weights_and_timestamp.get("lastUpdatedAt", -1.0))
        user_raw_weights = user_weights_and_timestamp.get("weights")

        user_raw_weights_nd = np.array(user_raw_weights, dtype=np.float32)

    # Get event ids for events the user has attended, was interested, and has blocked
    going_ids, interested_ids, uninterested_ids = get_interaction_ids(
        user_id, user_last_updated
    )

    att_mat = build_matrix(going_ids)
    int_mat = build_matrix(interested_ids)
    blk_mat = build_matrix(uninterested_ids)

    att_weights = build_weights(att_mat, row_weight=1.0)
    int_weights = build_weights(int_mat, row_weight=0.5)
    blk_weights = build_weights(blk_mat, row_weight=2.0)

    result: NDArray[np.float32] = np.concatenate(
        [att_weights, int_weights, blk_weights]
    ).astype(np.float32)

    return result + user_raw_weights_nd


def main(users: list[str], update_db: bool) -> None:
    init_tags()

    prefetched_state: dict[str, tuple[float, list[float] | None]] = {}

    if len(users) == 1:
        if users[0] == "ALL":
            all_users = queries.query_all("users")
            users = [row["_id"] for row in all_users]
        elif users[0] == "ACTIVE":
            # Guaranteed to have weights and lastUpdated if this query is ran
            # Can batch users for build_user_feature. Either all users have weights passed in or none do
            active_rows = queries.query_active(NUM_TAGS)
            users = [row["userId"] for row in active_rows]
            for row in active_rows:
                prefetched_state[row["userId"]] = (
                    float(row["lastUpdated"]),
                    row["weights"],
                )

    user_feature_vectors: dict[str, NDArray[np.float32]] = {}
    for user_id in users:
        last_updated, raw_weights = None, None
        if user_id in prefetched_state:
            last_updated, raw_weights = prefetched_state[user_id]

        user_feature_vectors[user_id] = build_user_feature_vector(user_id, last_updated=last_updated, weights=raw_weights)

    if update_db:
        for user_id, vec in user_feature_vectors.items():
            queries.upsert_user_tag_weights(user_id, vec.tolist())
        print(f"Updated {len(user_feature_vectors)} users in Convex.")
    else:
        for user_id, vec in user_feature_vectors.items():
            att = vec[:NUM_TAGS]
            int_ = vec[NUM_TAGS : 2 * NUM_TAGS]
            blk = vec[2 * NUM_TAGS :]
            print(f"\nUser {user_id}:")
            print(
                f"  attended  weights (top 5): {sorted(enumerate(att), key=lambda x: -x[1])[:5]}"
            )
            print(
                f"  interested weights (top 5): {sorted(enumerate(int_), key=lambda x: -x[1])[:5]}"
            )
            print(
                f"  blocked   weights (top 5): {sorted(enumerate(blk), key=lambda x: -x[1])[:5]}"
            )


USERS = ["ACTIVE"]
UPDATE_DB = True

if __name__ == "__main__":
    main(USERS, UPDATE_DB)
