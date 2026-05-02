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
    update_mat: NDArray[np.float32], discard_mat: NDArray[np.float32], row_weight: float = 1.0
) -> NDArray[np.float32]:
    """
    Converts an (n_events, num_tags) matrix into a (num_tags,) bounded weight vector.

    row_weight: scales each event's contribution before bounding.
      - attended: 1.0  (full signal)
      - interested: 0.5  (half signal)
      - blocked: 1.0  (full signal - strong negative preference)
    """
    if update_mat.shape[0] == 0:
        update_tag_weights = np.zeros(NUM_TAGS, dtype=np.float32)
    else:
        update_row_sums = update_mat.sum(axis=1, keepdims=True)
        update_row_sums[update_row_sums == 0] = 1.0
        updated_normalized = update_mat / update_row_sums
        update_tag_weights: NDArray[np.float32] = updated_normalized.sum(axis=0) * row_weight

    if discard_mat.shape[0] == 0:
        discard_tag_weights = np.zeros(NUM_TAGS, dtype=np.float32)
    else:
        discard_row_sums = discard_mat.sum(axis=1, keepdims=True)
        discard_row_sums[discard_row_sums == 0] = 1.0
        discard_normalized = discard_mat / discard_row_sums
        discard_tag_weights: NDArray[np.float32] = discard_normalized.sum(axis=0) * row_weight

    # Can be negative now
    return update_tag_weights - discard_tag_weights


def get_interaction_ids_from_rows(
    interactions: list[dict[str, str]],
) -> tuple[
    tuple[list[str], list[str], list[str]],  # current: (going, interested, uninterested)
    tuple[list[str], list[str], list[str]],  # previous: (going, interested, uninterested)
]:
    """Splits interaction rows into event ID lists by status."""
    cur_going, cur_int, cur_unint = [], [], []
    prev_going, prev_int, prev_unint = [], [], []

    for row in interactions:
        eid = row["eventId"]
        status = row.get("status")
        prev_status = row.get("previousStatus")

        if status == "going": cur_going.append(eid)
        elif status == "interested": cur_int.append(eid)
        elif status == "uninterested": cur_unint.append(eid)

        if prev_status == "going": prev_going.append(eid)
        elif prev_status == "interested": prev_int.append(eid)
        elif prev_status == "uninterested": prev_unint.append(eid)

    return (cur_going, cur_int, cur_unint), (prev_going, prev_int, prev_unint)


def get_user_raw_weights_and_last_updated(
    user_id: str,
) -> tuple[float, NDArray[np.float32]]:
    """Loads stored user weights and normalizes them to the expected shape."""
    user_weights_and_timestamp = queries.get_user_tag_weights_with_timestamp(user_id, NUM_TAGS)

    return get_user_raw_weights_and_last_updated_from_result(
        user_weights_and_timestamp
    )


def build_user_feature_vector_from_interactions(
    user_raw_weights_nd: NDArray[np.float32],
    interactions: list[dict[str, str]],
    event_tags_by_id: dict[str, list[dict[str, str]]],
) -> NDArray[np.float32]:
    """Builds a user feature vector from pre-fetched interaction rows."""
    (going_ids, interested_ids, uninterested_ids), (prev_going_ids, prev_interested_ids, prev_uninterested_ids) = get_interaction_ids_from_rows(
        interactions
    )

    if event_tags_by_id is None:
        att_mat = build_matrix(going_ids)
        int_mat = build_matrix(interested_ids)
        unint_mat = build_matrix(uninterested_ids)

        remove_att_mat = build_matrix(prev_going_ids)
        remove_int = build_matrix(prev_interested_ids)
        remove_unint = build_matrix(prev_uninterested_ids)
    else:
        att_mat = build_matrix_from_rows_by_event_id(going_ids, event_tags_by_id)
        int_mat = build_matrix_from_rows_by_event_id(interested_ids, event_tags_by_id)
        unint_mat = build_matrix_from_rows_by_event_id(uninterested_ids, event_tags_by_id)

        remove_att_mat = build_matrix_from_rows_by_event_id(prev_going_ids, event_tags_by_id)
        remove_int = build_matrix_from_rows_by_event_id(prev_interested_ids, event_tags_by_id)
        remove_unint = build_matrix_from_rows_by_event_id(prev_uninterested_ids, event_tags_by_id)

    att_weights = build_weights(att_mat, remove_att_mat, row_weight=1.0)
    int_weights = build_weights(int_mat, remove_int, row_weight=0.5)
    blk_weights = build_weights(unint_mat, remove_unint, row_weight=2.0)

    result: NDArray[np.float32] = np.concatenate(
        [att_weights, int_weights, blk_weights]
    ).astype(np.float32)

    # Logically this will still always be positive
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

    user_feature_vectors: dict[str, NDArray[np.float32]] = {}
    user_raw_weights_by_id: dict[str, NDArray[np.float32]] = {}
    interaction_rows: list[dict[str, float | str]] = []

    user_weights_and_timestamps_by_id: dict[str, tuple[float, list[float] | None]] = {}
    active_users = False

    if len(users) == 1:
        if users[0] == "ALL":
            all_users = queries.query_all("users")
            users = [row["_id"] for row in all_users]
        elif users[0] == "ACTIVE":
            # Guaranteed to have weights and lastUpdated if this query is ran
            # Can batch users for build_user_feature. Either all users have weights passed in or none do
            active_users = True

            active_rows = queries.query_active(NUM_TAGS)
            users = [row["userId"] for row in active_rows]

            for row in active_rows:
                user_weights_and_timestamps_by_id[row["userId"]] = (
                    float(row["updatedAt"]),
                    row["weights"],
                )

    if not active_users:
        user_weights_and_timestamps = queries.get_user_tag_weights_with_timestamps(
            users, NUM_TAGS
        )
        for row in user_weights_and_timestamps:
            user_weights_and_timestamps_by_id[row["userId"]] = (
                float(row["updatedAt"]),
                row["weights"],
            )

    for user_id in users:
        user_last_updated, user_raw_weights = user_weights_and_timestamps_by_id.get(user_id)
        user_raw_weights_nd = np.array(user_raw_weights)

        user_raw_weights_by_id[user_id] = user_raw_weights_nd

        interaction_rows.append({"userId": user_id, "sinceMs": user_last_updated})

    all_interactions: list[dict[str, str]] = (
        queries.get_interactions_by_users(interaction_rows) if interaction_rows else []
    )
    all_event_ids = list(dict.fromkeys([row["eventId"] for row in all_interactions]))
    all_event_tags = queries.get_by_event_ids(all_event_ids) if all_event_ids else []
    event_tags_by_id = group_event_tags_by_event_id(all_event_tags)

    interactions_by_user_id: dict[str, list[dict[str, str]]] = {}
    for interaction in all_interactions:
        user_id = interaction["userId"]
        if user_id not in interactions_by_user_id:
            interactions_by_user_id[user_id] = []
        interactions_by_user_id[user_id].append(interaction)

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


USERS = ["ACTIVE"]
UPDATE_DB = True

if __name__ == "__main__":
    main(USERS, UPDATE_DB)
