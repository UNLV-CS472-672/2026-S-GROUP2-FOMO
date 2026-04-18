import torch
import numpy as np

from models.twoTowerModel import UserTower, EventTower
from convex import ConvexClient
from utils.utils import get_client

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MAX_TAGS = 8   # normalizer for tag_count_norm, must match generate_training_data.py


def get_tag_info(client: ConvexClient) -> tuple[int, dict[str, int]]:
    tags          = client.query("data_ml/universal:queryAll", {"table_name": "tags"})
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


def get_event_features(
    client:       ConvexClient,
    num_tags:     int,
    tag_id_to_idx: dict[str, int],
) -> tuple[list[str], np.ndarray]:
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
        day_norm       = float(event.get("dayOfWeek",  5)) / 6.0
        hour_norm      = float(event.get("startHour", 19)) / 23.0
        is_free        = float(event.get("isFree",  False))


        event_ids.append(eid)
        event_rows.append(np.concatenate([tags, [tag_count_norm, day_norm, hour_norm, is_free]]))

    return event_ids, np.array(event_rows, dtype=np.float32)


def main(users: list[str], update_db: bool, k: int = 10) -> None:
    client = get_client()

    # ── Preprocessing
    num_tags, tag_id_to_idx = get_tag_info(client)

    if len(users) == 1 and users[0] == "ALL":
        all_users = client.query("data_ml/universal:queryAll", {"table_name": "users"})
        users     = [row["_id"] for row in all_users]

    user_features          = get_user_features(client, users, num_tags).to(DEVICE)
    event_ids, event_array = get_event_features(client, num_tags, tag_id_to_idx)
    event_features         = torch.from_numpy(event_array).to(DEVICE)

    # ── Load model
    user_tower  = UserTower(num_tags=num_tags).to(DEVICE)
    event_tower = EventTower(num_tags=num_tags).to(DEVICE)

    model_weights = torch.load("models/model8_interrupted.pt", map_location=DEVICE)
    user_tower.load_state_dict(model_weights['user_tower'])
    event_tower.load_state_dict(model_weights['event_tower'])

    user_tower.eval()
    event_tower.eval()

    # ── Inference: pass through towers → cosine similarity on embeddings
    with torch.no_grad():
        user_embeddings  = user_tower(user_features)    # (U, embed_dim)
        event_embeddings = event_tower(event_features)  # (E, embed_dim)

    # Towers apply F.normalize so embeddings are unit vectors.
    # Cosine similarity = dot product. Remap [-1, 1] → [0, 1] for storage.
    raw_scores = user_embeddings @ event_embeddings.T   # (U, E)
    scores     = (raw_scores + 1.0) / 2.0               # (U, E)

    # ── Hard-mask blocked events so they can never surface in recommendations.
    # The model's blocked slice nudges embeddings apart but isn't a guarantee —
    # this ensures a user's explicitly blocked events are always excluded.
    for i, user_id in enumerate(users):
        interactions = client.query(
            "data_ml/eventRec:getInteractionsByUserId", {"userId": user_id}
        )
        blocked_ids = {r["eventId"] for r in interactions if r["interactionType"] == "blocked"}
        for j, eid in enumerate(event_ids):
            if eid in blocked_ids:
                scores[i, j] = -1.0

    k = min(k, scores.shape[1])
    top_scores, top_indices = torch.topk(scores, k=k, dim=1)

    # ── Build recommendations
    recommendations: dict[str, list[dict]] = {}
    for i, user_id in enumerate(users):
        recommendations[user_id] = [
            {event_ids[event_idx]: top_scores[i][rank].item()}
            for rank, event_idx in enumerate(top_indices[i].tolist())
        ]

    # ── Write to Convex / Print
    if update_db:
        pass
    else:
        all_users_rows = client.query("data_ml/universal:queryAll", {"table_name": "users"})
        all_events_rows = client.query("data_ml/universal:queryAll", {"table_name": "events"})
        user_name = {row["_id"]: row["name"] for row in all_users_rows}
        event_name = {row["_id"]: row["name"] for row in all_events_rows}

        for user_id in users:
            print(f"\n{user_name.get(user_id, user_id)}:")
            for rank, rec in enumerate(recommendations[user_id], start=1):
                event_id, score = next(iter(rec.items()))
                print(f"  {rank}. {event_name.get(event_id, event_id)}: {score:.4f}")


USERS     = ["ALL"]
UPDATE_DB = False

if __name__ == "__main__":
    main(USERS, UPDATE_DB)