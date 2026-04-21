import os
import torch
import numpy as np

from convex import ConvexClient
from dotenv import load_dotenv
from typing import Optional

from models.twoTowerModel import UserTower, EventTower

load_dotenv()

CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")

client: Optional[ConvexClient] = (
    ConvexClient(CONVEX_CLOUD_URL) if CONVEX_CLOUD_URL else None
)

def get_client() -> ConvexClient:
    if client is None:
        raise RuntimeError("ConvexClient not initialized")
    return client


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MAX_TAGS = 8   # normalizer for tag_count_norm


def get_tag_info(client: ConvexClient) -> tuple[int, dict[str, int]]:
    tags = client.query("data_ml/universal:queryAll", {"table_name": "tags"})
    tag_id_to_idx = {tag["_id"]: i for i, tag in enumerate(tags)}
    return len(tags), tag_id_to_idx


def get_user_features(client: ConvexClient, users: list[str], num_tags: int) -> torch.Tensor:
    """
    Fetches the stored 3-slice user feature vectors from Convex.
    Shape: (num_users, 3 * num_tags)
    """
    user_weights = client.query("data_ml/eventRec:getUserTagWeights", {"userIDs": users})
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

    return torch.from_numpy(np.stack(fixed))


def get_event_features(client: ConvexClient, num_tags: int, tag_id_to_idx: dict[str, int]) -> tuple[list[str], np.ndarray]:
    """
    Builds the (num_tags + 4) feature vector for each event.
    Only returns events that haven't ended yet.
    Shape: (num_events, num_tags + 4)
    """
    all_events = client.query("data_ml/universal:queryAll", {"table_name": "events"})

    event_ids = []
    event_rows = []

    for event in all_events:
        eid  = event["_id"]
        tags = np.zeros(num_tags, dtype=np.float32)

        event_tags = client.query("data_ml/eventRec:getByEventId", {"eventId": eid})
        for row in event_tags:
            if row["tagId"] in tag_id_to_idx:
                tags[tag_id_to_idx[row["tagId"]]] = 1.0

        tag_count_norm = tags.sum() / MAX_TAGS

        # FIX: Need to be fixed, too lazy rn. Do in a diff pr
        day_norm = float(event.get("dayOfWeek",  5)) / 6.0
        hour_norm = float(event.get("startHour", 19)) / 23.0
        is_free = float(event.get("isFree",  False))

        event_ids.append(eid)
        event_rows.append(np.concatenate([tags, [tag_count_norm, day_norm, hour_norm, is_free]]))

    return event_ids, np.array(event_rows, dtype=np.float32)


def main(users: list[str], update_db: bool, model_path : str, k: int = 10) -> None:
    client = get_client()

    # Preprocessing
    num_tags, tag_id_to_idx = get_tag_info(client)

    if len(users) == 1 and users[0] == "ALL":
        all_users = client.query("data_ml/universal:queryAll", {"table_name": "users"})
        users     = [row["_id"] for row in all_users]

    user_features          = get_user_features(client, users, num_tags).to(DEVICE)
    event_ids, event_array = get_event_features(client, num_tags, tag_id_to_idx)
    event_features         = torch.from_numpy(event_array).to(DEVICE)

    # Load model
    user_tower  = UserTower(num_tags=num_tags).to(DEVICE)
    event_tower = EventTower(num_tags=num_tags).to(DEVICE)

    model_weights = torch.load(model_path, map_location=DEVICE)
    user_tower.load_state_dict(model_weights['user_tower'])
    event_tower.load_state_dict(model_weights['event_tower'])

    user_tower.eval()
    event_tower.eval()

    with torch.no_grad():
        user_embeddings  = user_tower(user_features)
        event_embeddings = event_tower(event_features)

    raw_scores = user_embeddings @ event_embeddings.T
    scores = (raw_scores + 1.0) / 2.0

    # Hard mask blocked events so they can never surface in recommendations.
    for i, user_id in enumerate(users):
        interactions = client.query("data_ml/eventRec:getInteractionsByUserId", {"userId": user_id})
        blocked_ids = {r["eventId"] for r in interactions if r["interactionType"] == "blocked"}
        for j, eid in enumerate(event_ids):
            if eid in blocked_ids:
                scores[i, j] = -1.0

    k = min(k, scores.shape[1])
    top_scores, top_indices = torch.topk(scores, k=k, dim=1)

    # Build recommendations
    recommendations: dict[str, list[dict]] = {}
    for i, user_id in enumerate(users):
        recommendations[user_id] = [
            {event_ids[event_idx]: top_scores[i][rank].item()}
            for rank, event_idx in enumerate(top_indices[i].tolist())
        ]

    # Write to Convex / Print
    if update_db:
        pass
    else:
        all_users_rows = client.query("data_ml/universal:queryAll", {"table_name": "users"})
        all_events_rows = client.query("data_ml/universal:queryAll", {"table_name": "events"})
        user_name = {row["_id"]: row["name"] for row in all_users_rows}
        event_name = {row["_id"]: row["name"] for row in all_events_rows}

        for user_id, user_n in user_name.items():
            print(f'{user_n} : {user_id}')

        print("")

        for event_id, event_n in event_name.items():
            print(f'{event_n} : {event_id}')

        for user_id in users:
            print(f"\n{user_name.get(user_id, user_id)}:")
            for rank, rec in enumerate(recommendations[user_id], start=1):
                event_id, score = next(iter(rec.items()))
                print(f"  {rank}. {event_name.get(event_id, event_id)}: {score:.4f}")


USERS = ["ALL"]
UPDATE_DB = False

if __name__ == "__main__":
    main(USERS, UPDATE_DB, 'models/curr_model.pt')

""" 
TODO: 
    1. (updateUserPreferences.py) Currently collects all attended events and cold start info and then performs calculations
       Need to update it so it performs running calculations. 
            - Could be done by checking when the weights were calculated last and only select events 
               that fall after that date.
            - Problem: Formula may need to be adjusted to acomodate for this
            - Could just ignore this issue. MVP!
    2. (updateUserPreferences.py) Optional: Add weight decay so weights can also decrease. Possibly could be done by decrementing
                 some weights if a user hasn't attended an event with said tag for the past X events.
                 Idk how to really do that with a running weight adjustment though
    3. (recommendEvent.py) Need to fix day_norm, hour_norm, and is_free fields in get_event_features. Commented "FIX:" at the spot
    4. (recommendEvent.py) Need to push recs to DB
    5. (All) UNIT TESTS
    6. (Optional): updateUserPreferences and this file may have some repetitive code, could add to utils file. If nothing needs to be added there
                   then we should just remove utils. Theres nothing really of use in there right now.
"""