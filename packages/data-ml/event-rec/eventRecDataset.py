import os
import random
from collections import defaultdict

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader, random_split
from convex import ConvexClient
from dotenv import load_dotenv


load_dotenv()

CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
if CONVEX_CLOUD_URL is None:
    raise EnvironmentError("CONVEX_CLOUD_URL not set")

client = ConvexClient(CONVEX_CLOUD_URL)

class EventRecDataset(Dataset):
    def __init__(self, user_weights: dict[str, list[float]], event_tags: torch.Tensor):
        self.user_vecs = torch.tensor(list(user_weights.values()), dtype=torch.float32)
        self.event_tags = event_tags  # [num_events, num_tags]

    def __len__(self):
        return len(self.user_vecs)

    def __getitem__(self, idx):
        user = self.user_vecs[idx]

        # Temporary get item, will be changed in the future
        pos_idx = torch.randint(len(self.event_tags), (1,)).item()
        neg_idx = torch.randint(len(self.event_tags), (1,)).item()
        return user, self.event_tags[pos_idx], self.event_tags[neg_idx]


def load_users() -> list[str]:
    users = client.query("data_ml/universal:queryAll", {"table_name": "users"})
    return [u["_id"] for u in users]


def load_user_weights(user_ids: list[str]) -> dict[str, list[float]]:
    all_weights = client.query("data_ml/updateUserPreferences:getAllUserTagWeights", {})
    weight_map = {row["userId"]: row["weights"] for row in all_weights}
    return {uid: weight_map[uid] for uid in user_ids if uid in weight_map}


def get_data_loader() -> DataLoader:
    # Pull and shuffle users
    user_ids = load_users()
    np.random.shuffle(user_ids)
    user_weights = load_user_weights(user_ids)

    # Pull event tags
    event_tags_raw = client.query("data_ml/universal:queryAll", {"table_name": "eventTags"})
    num_tags = max(row["tagIdx"] for row in event_tags_raw)
    event_tags = torch.zeros((len(event_tags_raw), num_tags), dtype=torch.float32)

    dataset = EventRecDataset(user_weights, event_tags)

    # Train/test split (80/20)
    train_size = int(0.8 * len(dataset))
    test_size = len(dataset) - train_size
    train_set, test_set = random_split(dataset, [train_size, test_size])

    train_loader = DataLoader(train_set, batch_size=32, shuffle=True)
    test_loader = DataLoader(test_set, batch_size=32, shuffle=False)

    return train_loader, test_loader

