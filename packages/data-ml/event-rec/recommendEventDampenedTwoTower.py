import torch
import numpy as np

from models.twoTowerModel import UserTower, EventTower

from convex import ConvexClient
from utils.utils import get_client

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

BETA = 0.10
TAU  = 1.25

def dampen(weights: torch.Tensor) -> torch.Tensor:
    """
    Apply the same bounded formula used in updateUserPreferences.py.
    bounded = 1 - exp(-(w + BETA) / TAU)
    Matches build_user_weight_from_matrix in the data generator exactly.
    """
    return 1.0 - torch.exp(-(weights + BETA) / TAU)


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
def get_events(client: ConvexClient, num_tags: int, tag_id_to_idx: dict[str, int]) -> dict[str, np.ndarray]:
    all_events = client.query("data_ml/universal:queryAll", {"table_name": "events"})

    event_ids = [event["_id"] for event in all_events]

    result: dict[str, np.ndarray] = {}
    for event_id in event_ids:
        vec = np.zeros(num_tags, dtype=np.float32)
        event_tags = client.query("data_ml/eventRec:getByEventId", {"eventId": event_id})
        for row in event_tags:
            tag_id = row["tagId"]
            if tag_id in tag_id_to_idx:
                vec[tag_id_to_idx[tag_id]] = 1.0
        result[event_id] = vec

    return result


def main(users: list[str], update_db: bool, model_path: str, k: int = 10) -> None:
    client = get_client()

    # ── Preprocessing
    tag_count, tag_id_to_idx = get_tag_count(client)

    if len(users) == 1 and users[0] == "ALL":
        all_users = client.query("data_ml/universal:queryAll", {"table_name": "users"})
        users = [row["_id"] for row in all_users]

    # user_weights: raw tag weights from Convex — (U, T)
    user_weights = get_user_weights(client, users, tag_count).to(DEVICE)
    events = get_events(client, tag_count, tag_id_to_idx)

    event_ids = list(events.keys())

    # Events stay as raw binary one-hots — matches training data generator exactly
    event_matrix_multihot = np.stack([events[event_id] for event_id in event_ids])
    event_tensor = torch.from_numpy(event_matrix_multihot).to(DEVICE)

    # ── Load model
    user_tower  = UserTower(tag_count).to(DEVICE)
    event_tower = EventTower(tag_count).to(DEVICE)

    model_weights = torch.load(model_path, map_location=DEVICE)
    user_tower.load_state_dict(model_weights['user_tower'])
    event_tower.load_state_dict(model_weights['event_tower'])

    user_tower.eval()
    event_tower.eval()

    # ── Dampen user weights before passing through tower
    # Events are kept as binary one-hots to match training conditions.
    # User weights are dampened to match build_user_weight_from_matrix
    # in the data generator (1 - exp(-(w + BETA) / TAU)).
    user_weights_dampened = dampen(user_weights)  # (U, T)

    # ── Inference
    with torch.no_grad():
        user_embeddings  = user_tower(user_weights_dampened)  # (U, embed_dim)
        event_embeddings = event_tower(event_tensor)          # (E, embed_dim)

    # Towers F.normalize their output so dot product = cosine similarity
    scores = user_embeddings @ event_embeddings.T  # (U, E)
    scores = (scores + 1) / 2

    k = min(k, scores.shape[1])
    top_scores, top_indices = torch.topk(scores, k=k, dim=1)

    # ── Build Recommendations
    recommendations = {}
    for i, user_id in enumerate(users):
        recommendations[user_id] = [
            {event_ids[event_idx]: top_scores[i][score_idx].item()}
            for score_idx, event_idx in enumerate(top_indices[i].tolist())
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
    main(USERS, UPDATE_DB, "models/model21.pt")