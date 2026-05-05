import os
import torch
import numpy as np
from numpy.typing import NDArray

from pathlib import Path
from lib import queries, log


from .models.twoTowerModel import UserTower, EventTower
from .data.updateUserPreferences import TAG_ID_TO_IDX, NUM_TAGS, init_tags
from .reranker import CandidateReranker

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MAX_TAGS = 8  # normalizer for tag_count_norm
BETA = 0.10
TAU = 1.25


def activation_fn(raw_weights: NDArray[np.float32]) -> NDArray[np.float32]:
    """
    Activation Function. Squishes values between 0 and 1
    """
    result: NDArray[np.float32] = (1.0 - np.exp(-(raw_weights + BETA) / TAU)).astype(
        np.float32
    )
    return result



def get_user_features(users: list[str], num_tags: int) -> torch.Tensor:
    """
    Fetches the stored 3-slice user feature vectors from Convex.
    Shape: (num_users, 3 * num_tags)
    """
    user_weights = queries.get_user_tag_weights(users)
    expected_dim = 3 * num_tags

    fixed = []
    for w in user_weights:
        if w is None:
            fixed.append(np.zeros(expected_dim, dtype=np.float32))
        else:
            arr = np.array(w, dtype=np.float32)
            if len(arr) < expected_dim:
                arr = np.pad(arr, (0, expected_dim - len(arr)))
            elif len(arr) > expected_dim:
                arr = arr[:expected_dim]
            fixed.append(arr)

    fixed_np: NDArray[np.float32] = np.stack(fixed)

    tag_prefs = queries.get_preferred_tags_by_user_id(users)

    if not isinstance(tag_prefs, list):
        tag_prefs = []

    prior = np.zeros(fixed_np.shape, dtype=np.float32)
    for user_idx, row in enumerate(tag_prefs):
        if row is None:
            continue
        for tag_id in row:
            if tag_id in TAG_ID_TO_IDX:
                prior[user_idx, TAG_ID_TO_IDX[tag_id]] = 1.0

    return torch.from_numpy(activation_fn(fixed_np + prior))


def get_event_features(
        num_tags: int, tag_id_to_idx: dict[str, int]
) -> tuple[
    list[str],
    NDArray[np.float32],
    dict[str, dict],  # events_by_id
    dict[str, list[dict[str, str]]],  # event_tags_by_id
]:
    """
    Builds the (num_tags + 4) feature vector for each event.
    Only returns events that haven't ended yet.

    Returns:
        event_ids:        ordered list of event IDs
        event_features:   (num_events, num_tags + 4) feature matrix
        events_by_id:     {event_id: full event dict} — for reranker
        event_tags_by_id: {event_id: [tag rows]}      — for reranker
    """
    all_events = queries.get_all_events_after_now()

    if not all_events:
        return [], np.zeros((0, num_tags + 4), dtype=np.float32), {}, {}

    all_event_ids = [event["_id"] for event in all_events]
    all_event_tags = queries.get_by_event_ids(all_event_ids)
    event_tags_by_id: dict[str, list[dict[str, str]]] = {}
    for row in all_event_tags:
        event_id = row["eventId"]
        if event_id not in event_tags_by_id:
            event_tags_by_id[event_id] = []
        event_tags_by_id[event_id].append(row)

    events_by_id: dict[str, dict] = {e["_id"]: e for e in all_events}

    event_ids = []
    event_rows = []

    for event in all_events:
        eid = event["_id"]
        tags = np.zeros(num_tags, dtype=np.float32)

        event_tags = event_tags_by_id.get(eid, [])
        for row in event_tags:
            if row["tagId"] in tag_id_to_idx:
                tags[tag_id_to_idx[row["tagId"]]] = 1.0

        tag_count_norm = tags.sum() / MAX_TAGS

        # FIX: Need to be fixed, too lazy rn. Do in a diff pr
        day_norm = float(event.get("dayOfWeek", 5)) / 6.0
        hour_norm = float(event.get("startHour", 19)) / 23.0
        is_free = float(event.get("isFree", False))

        event_ids.append(eid)
        event_rows.append(
            np.concatenate([tags, [tag_count_norm, day_norm, hour_norm, is_free]])
        )

    return event_ids, np.array(event_rows, dtype=np.float32), events_by_id, event_tags_by_id


def main(users: list[str], update_db: bool, model_path : str, k: int = 10) -> None:
    if len(users) == 1:
        if users[0] == "ALL":
            all_users = queries.query_all("users")
            users = [row["_id"] for row in all_users]
        elif users[0] == "DIRTY":
            users = queries.get_users_needing_event_rec()
            if not users:
                log("No users need event rec update.")
                return

    # Preprocessing — deferred until we know there's work to do
    num_tags, tag_id_to_idx = queries.get_tag_info()

    user_features          = get_user_features(users, num_tags).to(DEVICE)
    event_ids, event_array, events_by_id, event_tags_by_id = get_event_features(num_tags, tag_id_to_idx)
    event_features         = torch.from_numpy(event_array).to(DEVICE)

    # Load model
    user_tower = UserTower(num_tags=num_tags).to(DEVICE)
    event_tower = EventTower(num_tags=num_tags).to(DEVICE)

    model_weights = torch.load(model_path, map_location=DEVICE)
    user_tower.load_state_dict(model_weights["user_tower"])
    event_tower.load_state_dict(model_weights["event_tower"])

    user_tower.eval()
    event_tower.eval()

    with torch.no_grad():
        user_embeddings = user_tower(user_features)
        event_embeddings = event_tower(event_features)

    raw_scores = user_embeddings @ event_embeddings.T
    scores = (raw_scores + 1.0) / 2.0

    # Hard mask blocked events so they can never surface in recommendations.
    all_interactions = queries.get_interactions_by_user_ids(users)
    blocked_ids_by_user: dict[str, set[str]] = {user_id: set() for user_id in users}
    for row in all_interactions:
        user_id = row["userId"]
        if row["status"] == "uninterested" and user_id in blocked_ids_by_user:
            blocked_ids_by_user[user_id].add(row["eventId"])

    for i, user_id in enumerate(users):
        blocked_ids = blocked_ids_by_user.get(user_id, set())
        for j, eid in enumerate(event_ids):
            if eid in blocked_ids:
                scores[i, j] = -1.0

    retrieve_k = min(k * 5, scores.shape[1])
    top_scores, top_indices = torch.topk(scores, k=retrieve_k, dim=1)

    # Get accepted friend IDs for every user in this batch
    friends_by_user: dict[str, list[str]] = queries.get_friend_ids_batch(users)

    # Collect all unique friend IDs, then fetch their attendance
    all_friend_ids = list({fid for fids in friends_by_user.values() for fid in fids})
    friend_attendance_rows = (
        queries.get_interactions_by_user_ids(all_friend_ids) if all_friend_ids else []
    )

    # Group attendance by friend user ID for the reranker
    friend_attendance_by_user: dict[str, list[dict]] = {}
    for row in friend_attendance_rows:
        uid = row["userId"]
        if uid not in friend_attendance_by_user:
            friend_attendance_by_user[uid] = []
        friend_attendance_by_user[uid].append(row)

    # ---------- Rerank per user ----------
    recommendations: dict[str, list[str]] = {}

    for i, user_id in enumerate(users):
        candidates = [
            (event_ids[idx], top_scores[i][rank].item())
            for rank, idx in enumerate(top_indices[i].tolist())
        ]

        reranker = CandidateReranker(
            user_id=user_id,
            candidates=candidates,
            events_by_id=events_by_id,
            event_tags_by_id=event_tags_by_id,
            tag_id_to_idx=tag_id_to_idx,
            num_tags=num_tags,
            friend_ids=friends_by_user.get(user_id, []),
            friend_attendance=friend_attendance_by_user,
            user_interactions=all_interactions
        )

        recommendations[user_id] = reranker.rerank(k=k)

    # OLD: Build recommendations. Keeping here so i can compare
    # recommendations: dict[str, list[tuple[str, float]]] = {}
    # for i, user_id in enumerate(users):
    #     recommendations[user_id] = [
    #         (event_ids[event_idx], top_scores[i][rank].item())
    #         for rank, event_idx in enumerate(top_indices[i].tolist())
    #     ]

    # Write to Convex / Print
    if update_db:
        rows = []
        for user_id, event_ids_ranked in recommendations.items():
            rows.append({"userId": user_id, "eventIds": event_ids_ranked})
        queries.upsert_event_recs_batch(rows)

        print(f"Updated {len(recommendations)} users in Convex with {k} recs each.")

    else:
        all_users_rows = queries.query_all("users")
        all_events_rows = queries.query_all("events")
        user_name = {row["_id"]: row["username"] for row in all_users_rows}
        event_name = {row["_id"]: row["name"] for row in all_events_rows}

        for user_id, user_n in user_name.items():
            print(f"{user_n} : {user_id}")

        print("")

        for event_id, event_n in event_name.items():
            print(f"{event_n} : {event_id}")

        for user_id in users:
            print(f"\n{user_name.get(user_id, user_id)}:")
            for rank, event_id in enumerate(recommendations[user_id]):
                print(
                    f"  {rank + 1}. {event_name.get(event_id, event_id)}"
                )


USERS = ["DIRTY"]
UPDATE_DB = True

if __name__ == "__main__":  # pragma: no cover
    init_tags()
    log("Updating event recommendations...")
    model_dir = os.path.join(Path(__file__).parent, "models", "curr_model.pt")
    main(USERS, UPDATE_DB, model_dir)
    log("Event recommendations updated.")

""" 
TODO: 
    1. Query optimizaiton
    2. (updateUserPreferences.py) Optional: Add weight decay so weights can also decrease. Possibly could be done by decrementing
                 some weights if a user hasn't attended an event with said tag for the past X events.
                 Idk how to really do that with a running weight adjustment though
    3. (recommendEvent.py) Need to fix day_norm, hour_norm, and is_free fields in get_event_features. Commented "FIX:" at the spot
"""
