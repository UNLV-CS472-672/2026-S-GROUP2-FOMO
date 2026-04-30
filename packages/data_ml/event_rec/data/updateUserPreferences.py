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
    event_tags = queries.get_by_event_id(event_id)
    return event_multihot_from_rows(event_tags)


def event_multihot_from_rows(event_tags: list[dict[str, str]]) -> NDArray[np.float32]:
    """Returns a (num_tags,) binary vector from eventTags rows."""
    vec = np.zeros(NUM_TAGS, dtype=np.float32)
    for row in event_tags:
        tag_id = row["tagId"]
        if tag_id in TAG_ID_TO_IDX:
            vec[TAG_ID_TO_IDX[tag_id]] = 1.0
    return vec


def build_matrix(event_ids: list[str]) -> NDArray[np.float32]:
    """multihot matrix for list of event IDs."""
    if not event_ids:
        return np.zeros((0, NUM_TAGS), dtype=np.float32)

    event_tags = queries.get_by_event_ids(list(dict.fromkeys(event_ids)))
    return build_matrix_from_rows_by_event_id(
        event_ids, group_event_tags_by_event_id(event_tags)
    )


def group_event_tags_by_event_id(
    event_tags: list[dict[str, str]],
) -> dict[str, list[dict[str, str]]]:
    """Groups eventTags rows by eventId."""
    event_tags_by_id: dict[str, list[dict[str, str]]] = {}
    for row in event_tags:
        event_id = row["eventId"]
        if event_id not in event_tags_by_id:
            event_tags_by_id[event_id] = []
        event_tags_by_id[event_id].append(row)

    return event_tags_by_id


def build_matrix_from_rows_by_event_id(
    event_ids: list[str], event_tags_by_id: dict[str, list[dict[str, str]]]
) -> NDArray[np.float32]:
    """Builds a multihot matrix from pre-grouped eventTags rows."""

    return np.array(
        [event_multihot_from_rows(event_tags_by_id.get(event_id, [])) for event_id in event_ids],
        dtype=np.float32,
    )


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

    return get_interaction_ids_from_rows(interactions)


def get_interaction_ids_from_rows(
    interactions: list[dict[str, str]],
) -> tuple[list[str], list[str], list[str]]:
    """Splits interaction rows into event ID lists by status."""

    going = [row["eventId"] for row in interactions if row["status"] == "going"]
    interested = [
        row["eventId"] for row in interactions if row["status"] == "interested"
    ]
    uninterested = [
        row["eventId"] for row in interactions if row["status"] == "uninterested"
    ]

    return going, interested, uninterested


def get_user_raw_weights_and_last_updated(
    user_id: str,
) -> tuple[float, NDArray[np.float32]]:
    """Loads stored user weights and normalizes them to the expected shape."""
    user_weights_and_timestamp = queries.get_user_tag_weights_with_timestamp(user_id, NUM_TAGS)

    return get_user_raw_weights_and_last_updated_from_result(
        user_weights_and_timestamp
    )


def get_user_raw_weights_and_last_updated_from_result(
    user_weights_and_timestamp: Optional[dict[str, object]],
) -> tuple[float, NDArray[np.float32]]:
    """Normalizes a stored weight/timestamp payload to the expected shape."""

    expected_dim = 3 * NUM_TAGS
    user_last_updated = -1.0
    user_raw_weights_nd = np.zeros(expected_dim, dtype=np.float32)

    if user_weights_and_timestamp is not None:
        user_last_updated = float(user_weights_and_timestamp.get("lastUpdatedAt", -1.0))
        user_raw_weights = user_weights_and_timestamp.get("weights")
        if user_raw_weights is not None:
            raw = np.array(user_raw_weights, dtype=np.float32)
            if len(raw) == expected_dim:
                user_raw_weights_nd = raw
            elif len(raw) == NUM_TAGS:
                user_raw_weights_nd[:NUM_TAGS] = raw

    return user_last_updated, user_raw_weights_nd


def build_user_feature_vector_from_interactions(
    user_raw_weights_nd: NDArray[np.float32],
    interactions: list[dict[str, str]],
    event_tags_by_id: Optional[dict[str, list[dict[str, str]]]] = None,
) -> NDArray[np.float32]:
    """Builds a user feature vector from pre-fetched interaction rows."""
    going_ids, interested_ids, uninterested_ids = get_interaction_ids_from_rows(
        interactions
    )

    if event_tags_by_id is None:
        att_mat = build_matrix(going_ids)
        int_mat = build_matrix(interested_ids)
        blk_mat = build_matrix(uninterested_ids)
    else:
        att_mat = build_matrix_from_rows_by_event_id(going_ids, event_tags_by_id)
        int_mat = build_matrix_from_rows_by_event_id(interested_ids, event_tags_by_id)
        blk_mat = build_matrix_from_rows_by_event_id(uninterested_ids, event_tags_by_id)

    att_weights = build_weights(att_mat, row_weight=1.0)
    int_weights = build_weights(int_mat, row_weight=0.5)
    blk_weights = build_weights(blk_mat, row_weight=2.0)

    result: NDArray[np.float32] = np.concatenate(
        [att_weights, int_weights, blk_weights]
    ).astype(np.float32)

    return result + user_raw_weights_nd


def build_user_feature_vector(user_id: str) -> NDArray[np.float32]:
    """
    Builds full (3 * num_tags,) feature vector for one user:
      [going_weights | interested_weights | uninterested_weights]
    """
    user_last_updated, user_raw_weights_nd = get_user_raw_weights_and_last_updated(
        user_id
    )

    if user_last_updated >= 0:
        interactions = queries.get_interactions_by_user_id(user_id, user_last_updated)
    else:
        interactions = queries.get_interactions_by_user_id(user_id)

    return build_user_feature_vector_from_interactions(
        user_raw_weights_nd, interactions
    )


def main(users: list[str], update_db: bool) -> None:
    init_tags()

    if len(users) == 1 and users[0] == "ALL":
        all_users = queries.query_all("users")
        users = [row["_id"] for row in all_users]

    user_feature_vectors: dict[str, NDArray[np.float32]] = {}
    user_raw_weights_by_id: dict[str, NDArray[np.float32]] = {}
    interaction_rows = []

    user_weights_and_timestamps = queries.get_user_tag_weights_with_timestamps(
        users, NUM_TAGS
    )
    user_weights_and_timestamps_by_id = {
        row["userId"]: row for row in user_weights_and_timestamps
    }

    for user_id in users:
        user_last_updated, user_raw_weights_nd = (
            get_user_raw_weights_and_last_updated_from_result(
                user_weights_and_timestamps_by_id.get(user_id)
            )
        )
        user_raw_weights_by_id[user_id] = user_raw_weights_nd

        row: dict[str, float | str] = {"userId": user_id}
        if user_last_updated >= 0:
            row["sinceMs"] = user_last_updated
        interaction_rows.append(row)

    all_interactions = (
        queries.get_interactions_by_users(interaction_rows) if interaction_rows else []
    )
    all_event_ids = list(dict.fromkeys([row["eventId"] for row in all_interactions]))
    all_event_tags = queries.get_by_event_ids(all_event_ids) if all_event_ids else []
    event_tags_by_id = group_event_tags_by_event_id(all_event_tags)

    interactions_by_user_id: dict[str, list[dict[str, str]]] = {}
    for row in all_interactions:
        user_id = row["userId"]
        if user_id not in interactions_by_user_id:
            interactions_by_user_id[user_id] = []
        interactions_by_user_id[user_id].append(row)

    for user_id in users:
        user_feature_vectors[user_id] = build_user_feature_vector_from_interactions(
            user_raw_weights_by_id[user_id],
            interactions_by_user_id.get(user_id, []),
            event_tags_by_id,
        )

    if update_db:
        rows = [
            {"userId": user_id, "weights": vec.tolist()}
            for user_id, vec in user_feature_vectors.items()
        ]
        queries.upsert_user_tag_weights_batch(rows)
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


USERS = ["ALL"]
UPDATE_DB = True

if __name__ == "__main__":
    main(USERS, UPDATE_DB)
