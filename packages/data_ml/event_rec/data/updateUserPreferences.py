import os
import numpy as np
from numpy.typing import NDArray

from dotenv import load_dotenv
from typing import Optional
from lib import queries

import time

# Number of tags in the system, populated by init_tags(). Drives all vector dimensions:
# multihot vectors are length NUM_TAGS, full feature vectors are length 3 * NUM_TAGS.
NUM_TAGS = 0
# Maps tag _id (string) to its index in multihot/weight vectors.
TAG_ID_TO_IDX: dict[str, int] = {}

# Constants
W_MAX_GOING       = 6.0   # cap for "going" tag weight
W_MAX_INTERESTED  = 5.0   # cap for "interested"
W_MAX_BLOCKED     = 8.0   # cap for "blocked" (higher — explicit signal)
W_FLOOR           = 0.05  # never decay below this
DECAY_THRESHOLD   = 1.0   # only decay weights above this
DECAY_RATE_GOING  = 0.95  # multiply per "decay event"
DECAY_RATE_INT    = 0.95
DECAY_RATE_UNINT  = 0.99  # blocked decays much slower
DECAY_CEILING     = 0.5  # max absolute decrease per decay event
NOW_MS = time.time() * 1000.0
DECAY_INTERVAL_MS = 3 * 24 * 3600 * 1000.0  # Every 3 days

def init_tags() -> None:
    """init tags"""
    # Must be called before any other function in this module so NUM_TAGS and
    # TAG_ID_TO_IDX are populated. Tag index assignment is whatever order the
    # query returns; consistent across a single run.
    global NUM_TAGS, TAG_ID_TO_IDX
    tags = queries.query_all("tags")
    TAG_ID_TO_IDX = {tag["_id"]: i for i, tag in enumerate(tags)}
    NUM_TAGS = len(TAG_ID_TO_IDX)


def apply_weight_decay(
    stored_weights, update_contribution, discard_contribution,
    threshold, decay_rate, floor, ceiling,
) -> NDArray[np.float32]:
    touched = (update_contribution != 0) | (discard_contribution != 0)
    above_threshold = stored_weights > threshold
    decay_mask = (~touched) & above_threshold

    decayed = np.where(decay_mask, stored_weights * decay_rate, stored_weights)
    max_drop_floor = stored_weights - ceiling
    decayed = np.maximum(decayed, max_drop_floor)
    decayed = np.maximum(decayed, floor)
    return decayed


def event_multihot_from_rows(event_tags: list[dict[str, str]]) -> NDArray[np.float32]:
    """Returns a (num_tags,) binary vector from eventTags rows."""
    # 1.0 at each tag's index, 0.0 elsewhere. Tags not in TAG_ID_TO_IDX are
    # silently skipped (stale tag references).
    vec = np.zeros(NUM_TAGS, dtype=np.float32)
    for row in event_tags:
        tag_id = row["tagId"]
        if tag_id in TAG_ID_TO_IDX:
            vec[TAG_ID_TO_IDX[tag_id]] = 1.0
    return vec


def build_matrix(event_ids: list[str]) -> NDArray[np.float32]:
    """multihot matrix for list of event IDs."""
    # Per-event-query path. Used by single-user code that doesn't have
    # pre-fetched event tags. Main batched flow uses
    # build_matrix_from_rows_by_event_id directly.
    if not event_ids:
        return np.zeros((0, NUM_TAGS), dtype=np.float32)

    # Dedupe before querying to avoid wasted reads when the same event
    # appears multiple times across buckets.
    event_tags = queries.get_by_event_ids(list(dict.fromkeys(event_ids)))
    return build_matrix_from_rows_by_event_id(
        event_ids, group_event_tags_by_event_id(event_tags)
    )


def group_event_tags_by_event_id(
    event_tags: list[dict[str, str]],
) -> dict[str, list[dict[str, str]]]:
    """Groups eventTags rows by eventId."""
    # Used to build a lookup table once per recompute so per-event multihot
    # construction is a dict get instead of another DB query.
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
    # One row per event_id in the order given. event_ids may contain duplicates
    # (e.g., same event in multiple status buckets across a batch); each
    # duplicate produces a row, contributing again on purpose.
    return np.array(
        [event_multihot_from_rows(event_tags_by_id.get(event_id, [])) for event_id in event_ids],
        dtype=np.float32,
    )


def build_weights(
    update_mat: NDArray[np.float32], discard_mat: NDArray[np.float32], row_weight: float = 1.0
) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
    """
    Converts an (n_events, num_tags) matrix into a (num_tags,) bounded weight vector.

    row_weight: scales each event's contribution before bounding.
      - attended: 1.0  (full signal)
      - interested: 0.5  (half signal)
      - blocked: 1.0  (full signal - strong negative preference)
    """
    # update_mat: events whose current status puts them in this bucket.
    # discard_mat: events whose previous status was in this bucket but is no
    # longer (i.e., the contribution that needs to be removed). Returning
    # update - discard is the delta to apply to stored weights for this bucket.
    if update_mat.shape[0] == 0:
        update_tag_weights: NDArray[np.float32] = np.zeros(NUM_TAGS, dtype=np.float32)
    else:
        # Normalize each event's row so its tags sum to 1, then sum across
        # events. Result: events with many tags spread their signal thinner
        # than narrowly-tagged events.
        update_row_sums = update_mat.sum(axis=1, keepdims=True)
        update_row_sums[update_row_sums == 0] = 1.0
        updated_normalized = update_mat / update_row_sums
        update_tag_weights = updated_normalized.sum(axis=0) * row_weight

    if discard_mat.shape[0] == 0:
        discard_tag_weights: NDArray[np.float32] = np.zeros(NUM_TAGS, dtype=np.float32)
    else:
        discard_row_sums = discard_mat.sum(axis=1, keepdims=True)
        discard_row_sums[discard_row_sums == 0] = 1.0
        discard_normalized = discard_mat / discard_row_sums
        discard_tag_weights = discard_normalized.sum(axis=0) * row_weight

    # Can be negative now
    return update_tag_weights, discard_tag_weights


def get_interaction_ids_from_rows(
    interactions: list[dict[str, str]],
) -> tuple[
    tuple[list[str], list[str], list[str]],  # current: (going, interested, uninterested)
    tuple[list[str], list[str], list[str]],  # previous: (going, interested, uninterested)
]:
    """Splits interaction rows into event ID lists by status."""
    # Returns parallel buckets for current and previous status. The TS layer
    # only returns rows where status != previousStatus, so an event can land
    # in different buckets between current and previous (this is how toggles
    # are handled). Rows with no previous status only contribute to current.
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
) -> tuple[float, NDArray[np.float32], float]:
    """Loads stored user weights and normalizes them to the expected shape."""
    user_weights_and_timestamp = queries.get_user_tag_weights_with_timestamp(user_id, NUM_TAGS)

    user_last_updated = float(result["updatedAt"])
    user_raw_weights_nd = np.array(result["weights"])
    last_decayed_at = float(result["lastDecayedAt"])

    return user_last_updated, user_raw_weights_nd, last_decayed_at


def build_user_feature_vector_from_interactions(
    user_raw_weights_nd: NDArray[np.float32],
    interactions: list[dict[str, str]],
    event_tags_by_id: Optional[dict[str, list[dict[str, str]]]] = None,
    should_decay: bool = False,
) -> NDArray[np.float32]:
    """Builds a user feature vector from pre-fetched interaction rows."""
    # interactions only contains rows where status changed since the last
    # weight update. The deltas are added on top of the user's stored weights
    # rather than recomputed from scratch.
    (going_ids, interested_ids, uninterested_ids), (prev_going_ids, prev_interested_ids, prev_uninterested_ids) = get_interaction_ids_from_rows(
        interactions
    )

    if event_tags_by_id is None:
        # Fallback path: no pre-fetched tag dict, query per event. Not used by
        # the batched main flow.
        att_mat = build_matrix(going_ids)
        int_mat = build_matrix(interested_ids)
        unint_mat = build_matrix(uninterested_ids)

        remove_att_mat = build_matrix(prev_going_ids)
        remove_int = build_matrix(prev_interested_ids)
        remove_unint = build_matrix(prev_uninterested_ids)
    else:
        # Batched path: every event's tags are already in event_tags_by_id, so
        # multihot construction is pure dict lookups, no DB calls.
        att_mat = build_matrix_from_rows_by_event_id(going_ids, event_tags_by_id)
        int_mat = build_matrix_from_rows_by_event_id(interested_ids, event_tags_by_id)
        unint_mat = build_matrix_from_rows_by_event_id(uninterested_ids, event_tags_by_id)

        remove_att_mat = build_matrix_from_rows_by_event_id(prev_going_ids, event_tags_by_id)
        remove_int = build_matrix_from_rows_by_event_id(prev_interested_ids, event_tags_by_id)
        remove_unint = build_matrix_from_rows_by_event_id(prev_uninterested_ids, event_tags_by_id)

    # Per-bucket row weights: blocked has the strongest signal because explicit
    # rejection is a stronger preference indicator than passive interest.
    update_att_weights, discard_att_weights = build_weights(att_mat, remove_att_mat, row_weight=1.25) # Rarer to go, stronger signal
    update_int_weights, discard_int_weights = build_weights(int_mat, remove_int, row_weight=0.5)
    update_blk_weights, discard_blk_weights = build_weights(unint_mat, remove_unint, row_weight=1.0)

    att_old = user_raw_weights_nd[:NUM_TAGS]
    int_old = user_raw_weights_nd[NUM_TAGS:2 * NUM_TAGS]
    blk_old = user_raw_weights_nd[2 * NUM_TAGS:]

    if should_decay:
        att_new = apply_weight_decay(att_old, update_att_weights, discard_att_weights,
                                     DECAY_THRESHOLD, DECAY_RATE_GOING, W_FLOOR, DECAY_CEILING)
        int_new = apply_weight_decay(int_old, update_int_weights, discard_int_weights,
                                     DECAY_THRESHOLD, DECAY_RATE_INT, W_FLOOR, DECAY_CEILING)
        blk_new = apply_weight_decay(blk_old, update_blk_weights, discard_blk_weights,
                                     DECAY_THRESHOLD, DECAY_RATE_UNINT, W_FLOOR, DECAY_CEILING)
    else:
        att_new = att_old
        int_new = int_old
        blk_new = blk_old

    new_user_weights_nd = np.concatenate(
        [att_new, int_new, blk_new]
    ).astype(np.float32)

    update_contributions: NDArray[np.float32] = np.concatenate(
        [update_att_weights, update_int_weights, update_blk_weights]
    ).astype(np.float32)

    discard_contributions: NDArray[np.float32] = np.concatenate(
        [discard_att_weights, discard_int_weights, discard_blk_weights]
    ).astype(np.float32)

    # Logically this will still always be positive.
    final = update_contributions + new_user_weights_nd - discard_contributions
    caps = np.concatenate([
        np.full(NUM_TAGS, W_MAX_GOING, dtype=np.float32),
        np.full(NUM_TAGS, W_MAX_INTERESTED, dtype=np.float32),
        np.full(NUM_TAGS, W_MAX_BLOCKED, dtype=np.float32),
    ])
    final = np.minimum(final, caps)
    final[np.abs(final) < 1e-6] = 0
    return final


def build_user_feature_vector(user_id: str) -> NDArray[np.float32]:
    """
    Builds full (3 * num_tags,) feature vector for one user:
      [going_weights | interested_weights | uninterested_weights]
    """
    # Single-user path. Main batched flow doesn't use this.
    user_last_updated, user_raw_weights_nd, _ = get_user_raw_weights_and_last_updated(
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
    user_should_decay_by_id: dict[str, bool] = {}

    user_weights_and_timestamps_by_id: dict[str, tuple[float, list[float] | None, float]] = {}
    active_users = False

    # Resolve user list. ALL queries every user, ACTIVE only those with new
    # interactions since their last weight update (the cron-friendly path).
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
                    float(row["lastDecayedAt"]),
                )

    # ACTIVE already returned weights+timestamps, so this query is only
    # needed for the non-ACTIVE case.
    if not active_users:
        user_weights_and_timestamps = queries.get_user_tag_weights_with_timestamps(
            users, NUM_TAGS
        )
        for row in user_weights_and_timestamps:
            user_weights_and_timestamps_by_id[row["userId"]] = (
                float(row["updatedAt"]),
                row["weights"],
                float(row["lastDecayedAt"]),
            )

    # Build interaction request payload. sinceMs tells the TS layer which
    # attendance rows to consider (only those changed since the last weight
    # update for this user).
    for user_id in users:
        user_last_updated, user_raw_weights, user_last_decayed = user_weights_and_timestamps_by_id[user_id]
        user_raw_weights_nd = np.array(user_raw_weights)

        user_raw_weights_by_id[user_id] = user_raw_weights_nd

        interaction_rows.append({"userId": user_id, "sinceMs": user_last_updated})

        should_decay = (NOW_MS - user_last_decayed) >= DECAY_INTERVAL_MS
        user_should_decay_by_id[user_id] = should_decay

    # Single batched call for all users' changed interactions. The TS mutation
    # also marks each returned row's previousStatus = status as a side effect,
    # so the next run sees these rows as already-folded-in.
    all_interactions: list[dict[str, str]] = (
        queries.get_interactions_by_users(interaction_rows) if interaction_rows else []
    )
    # One batched call for every event referenced across all users, so the
    # per-event tag lookup later is dict-only.
    all_event_ids = list(dict.fromkeys([row["eventId"] for row in all_interactions]))
    all_event_tags = queries.get_by_event_ids(all_event_ids) if all_event_ids else []
    event_tags_by_id = group_event_tags_by_event_id(all_event_tags)

    # Bucket interactions by user so each feature-vector build sees only
    # that user's rows.
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
            should_decay=user_should_decay_by_id[user_id],
        )

    if update_db:
        # Single batched upsert for everyone updated this run.
        rows = []
        for user_id, vec in user_feature_vectors.items():
            row: dict = {"userId": user_id, "weights": vec.tolist()}
            if user_should_decay_by_id[user_id]:
                row["lastDecayedAt"] = int(NOW_MS)

            rows.append(row)

        queries.upsert_user_tag_weights_batch(rows)
        print(f"Updated {len(user_feature_vectors)} users in Convex.")
    else:
        # Dry-run: print top-5 tags per bucket for each user, no DB write.
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