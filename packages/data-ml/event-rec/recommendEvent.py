import torch
import numpy as np

from models.twoTowerModel import UserTower, EventTower

from convex import ConvexClient
from dotenv import load_dotenv
from utils.utilities import get_client


def get_tag_count(client: ConvexClient) -> int:
    tags = client.query("data_ml/universal:queryAll", {"table_name": "tags"})
    return len(tags)

def get_user_weights(users: list[str]) -> list[str]:
    user_weights = None # temporary

    return user_weights

def get_events(client: ConvexClient) -> dict[str, np.ndarry]:
    event_weights = None
    return event_weights

# def get_recommendations(user_tower: UserTower, event_tower: EventTower, user_weights: torch.Tensor, event_tensor: torch.Tensor, users: list[str], k=10) -> list[str]:



def main(users: list[str], update_db: bool, k: int = 10) -> None:
    client = get_client()

    # ── Preprocessing
    tag_count = get_tag_count(client)

    if len(users) == 1 and users[0] == "ALL":
        all_users = client.query("data_ml/universal:queryAll", {"table_name": "users"})
        users = [row["_id"] for row in all_users]

    user_weights = get_user_weights(users)
    events = get_events(client)

    event_ids = list(events.keys())

    event_matrix_multihot = np.stack([events[event_id] for event_id in event_ids])
    event_tensor = torch.from_numpy(event_matrix_multihot)

    # Load model
    user_tower = UserTower(tag_count)
    event_tower = EventTower(tag_count)

    model_weights = torch.load("model.pt")

    user_tower.load_state_dict(model_weights['user_tower'])
    event_tower.load_state_dict(model_weights['event_tower'])

    # Set to eval mode
    user_tower.eval()
    event_tower.eval()

    # ── Inference
    user_logits = user_tower(user_weights)
    event_logits = event_tower(event_tensor)

    scores = user_logits @ event_logits.T

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
        for user_id in users:
            print(f"{user_id}: {recommendations[user_id]}")


USERS = ["ALL"]
UPDATE_DB = False

if __name__ == "__main__":
    main(USERS, UPDATE_DB)
