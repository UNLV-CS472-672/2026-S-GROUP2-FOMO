import torch
import numpy as np

from models.twoTowerModel import UserTower, EventTower

from convex import ConvexClient
from dotenv import load_dotenv
from utils.utils import get_client

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_tag_count(client: ConvexClient) -> tuple[int, dict[str, int]]:
    tags = client.query("data_ml/universal:queryAll", {"table_name": "tags"})

    tag_id_to_idx = {tag["_id"]: i for i, tag in enumerate(tags)}

    return len(tags), tag_id_to_idx

def get_user_weights(client: ConvexClient, users: list[str], tag_count: int) -> torch.Tensor:
    user_weights = client.query("data_ml/eventRec:getUserTagWeights", {"userIDs": users})

    fixed = []
    for w in user_weights:
        if w is None:
            fixed.append(np.zeros(tag_count, dtype=np.float32))
        else:
            arr = np.array(w, dtype=np.float32)
            if len(arr) < tag_count:
                arr = np.pad(arr, (0, tag_count - len(arr)))
            elif len(arr) > tag_count:
                arr = arr[:tag_count]
            fixed.append(arr)

    return torch.from_numpy(np.stack(fixed))

# Needs to be updated to only provide recs for events not already ended
def get_events(client: ConvexClient, num_tags: int, tag_id_to_idx: dict[str, int]) -> dict[str, np.ndarry]:
    all_events = client.query("data_ml/universal:queryAll", {"table_name": "events"})

    event_ids = [event["_id"] for event in all_events]

    result: dict[str, np.ndarray] = {}
    # Get tags associated with the events and create a onehot of the tags for the event
    for event_id in event_ids:
        vec = np.zeros(num_tags, dtype=np.float32)
        event_tags = client.query("data_ml/eventRec:getByEventId", {"eventId": event_id})
        for row in event_tags:
            tag_id = row["tagId"]

            if tag_id in tag_id_to_idx:
                vec[tag_id_to_idx[tag_id]] = 1.0

        result[event_id] = vec

    return result


def main(users: list[str], update_db: bool, k: int = 10) -> None:
    client = get_client()

    # ── Preprocessing
    tag_count, tag_id_to_idx = get_tag_count(client)

    if len(users) == 1 and users[0] == "ALL":
        all_users = client.query("data_ml/universal:queryAll", {"table_name": "users"})
        users = [row["_id"] for row in all_users]

    # user_weights returns a tensor of the user weights (users, num_tags)
    user_weights = get_user_weights(client, users, tag_count).to(DEVICE)
    events = get_events(client, tag_count, tag_id_to_idx)

    event_ids = list(events.keys())

    event_matrix_multihot = np.stack([events[event_id] for event_id in event_ids])
    event_tensor = torch.from_numpy(event_matrix_multihot).to(DEVICE)

    # Load model
    user_tower = UserTower(tag_count).to(DEVICE)
    event_tower = EventTower(tag_count).to(DEVICE)

    model_weights = torch.load("models/model17.pt", map_location=DEVICE)

    user_tower.load_state_dict(model_weights['user_tower'])
    event_tower.load_state_dict(model_weights['event_tower'])

    # Set to eval mode
    user_tower.eval()
    event_tower.eval()

    # ── Inference
    # Dampened cosine similarity on raw tag weights: non-event tags are scaled
    # by NON_EVENT_TAG_WEIGHT so extra user interests don't dilute the score.
    NON_EVENT_TAG_WEIGHT = 0.3

    uw   = user_weights.cpu().numpy().astype(np.float32)  # (U, T)
    ev   = event_matrix_multihot.astype(np.float32)       # (E, T)
    u_sq = uw ** 2

    alpha          = NON_EVENT_TAG_WEIGHT
    dot            = uw @ ev.T                                           # (U, E)
    A              = u_sq @ ev.T                                         # (U, E)
    B              = u_sq.sum(axis=1, keepdims=True)                     # (U, 1)
    adjusted_norms = np.sqrt(alpha**2 * B + (1 - alpha**2) * A + 1e-8)  # (U, E)
    e_norms        = np.sqrt(ev.sum(axis=1) + 1e-8)                      # (E,)

    scores = torch.from_numpy(dot / (adjusted_norms * e_norms[np.newaxis, :])).to(DEVICE)



    k = min(k, scores.shape[1])
    top_scores, top_indices = torch.topk(scores, k=k, dim=1)

    # ── Build Recommendations
    recommendations = {}
    for i, user_id in enumerate(users):
        recommendations[user_id] = [
            {event_ids[event_idx] : top_scores[i][score_idx]} for score_idx, event_idx in enumerate(top_indices[i].tolist())
        ]

    # ── Write to Convex / Print
    if update_db:
        pass
    else:
        print("\nUser Weights:")
        for i, user_id in enumerate(users):
            print(f"  {user_id}: {user_weights[i].cpu().numpy()}")

        print("\nEvent One-Hots:")
        for event_id in event_ids:
            print(f"  {event_id}: {events[event_id]}")

        for user_id in users:
            print(f"\nUser {user_id}:")
            for rank, rec in enumerate(recommendations[user_id], start=1):
                event_id, score = next(iter(rec.items()))
                print(f"  {rank}. {event_id}: {score:.4f}")


USERS = ["ALL"]
UPDATE_DB = False

if __name__ == "__main__":
    main(USERS, UPDATE_DB)
