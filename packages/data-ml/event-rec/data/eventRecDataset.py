"""
Supports two modes:

  1. OFFLINE  (default for training w/ generated data)
     Loads from .npy files produced by generate_training_data.py.
     No Convex connection needed.

  2. ONLINE  (production)
     Pulls live data from Convex.

Usage (offline):
    train_loader, test_loader = get_data_loader(mode="offline", data_dir="training/training_data/")

Usage (online):
    train_loader, test_loader = get_data_loader(mode="online")

Feature shapes:
    user_features  : (num_users,  3 * num_tags)   — [attended | interested | blocked]
    event_features : (num_events, num_tags + 4)   — [multihot | tag_count_norm | day_norm | hour_norm | is_free]
    triplets       : (N, 3)  int — [user_idx, pos_event_idx, neg_event_idx]
"""

from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader, random_split
from typing import Any, Optional


# ── Dataset ────────────────────────────────────────────────────────────────────

class EventRecDataset(Dataset[Any]):
    """
    Each sample is a BPR triplet:
        (user_feature_vec, pos_event_feature_vec, neg_event_feature_vec)
    """

    def __init__(self, user_features: torch.Tensor , event_features: torch.Tensor, triplets: Optional[torch.Tensor] = None) -> None:
        self.user_features  = user_features    # (num_users,  3*num_tags)
        self.event_features = event_features   # (num_events, num_tags+4)
        self.triplets       = triplets         # (N, 3) or None

    def __len__(self) -> int:
        return len(self.triplets) if self.triplets is not None else len(self.user_features)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        if self.triplets is not None:
            u_idx, pos_idx, neg_idx = self.triplets[idx]
            user = self.user_features[int(u_idx)]
            pos  = self.event_features[int(pos_idx)]
            neg  = self.event_features[int(neg_idx)]
        else:
            # Random sampling fallback (not preferred — use mined triplets)
            user    = self.user_features[idx]
            pos_idx = torch.randint(len(self.event_features), (1,)).item()
            neg_idx = torch.randint(len(self.event_features), (1,)).item()
            pos     = self.event_features[int(pos_idx)]
            neg     = self.event_features[int(neg_idx)]

        return user, pos, neg


# ── Loaders ────────────────────────────────────────────────────────────────────

def _make_loaders(dataset: EventRecDataset ,batch_size: int = 32) -> tuple[DataLoader[EventRecDataset], DataLoader[EventRecDataset]]:
    train_size = int(0.8 * len(dataset))
    test_size  = len(dataset) - train_size
    train_set, test_set = random_split(dataset, [train_size, test_size])
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
    test_loader  = DataLoader(test_set,  batch_size=batch_size, shuffle=False)
    return train_loader, test_loader


def _load_offline(data_dir:   str, batch_size: int = 32) -> tuple[DataLoader[EventRecDataset], DataLoader[EventRecDataset]]:
    d = Path(data_dir)
    user_features  = torch.from_numpy(np.load(d / "user_features.npy"))
    event_features = torch.from_numpy(np.load(d / "event_features.npy"))
    triplets       = torch.from_numpy(np.load(d / "triplets.npy")).long()

    dataset = EventRecDataset(user_features, event_features, triplets=triplets)
    return _make_loaders(dataset, batch_size)


def _load_online(batch_size: int = 32) -> tuple[DataLoader[EventRecDataset], DataLoader[EventRecDataset]]:
    """Pull live data from Convex."""
    from utils.utils import get_client
    from updateUserPreferences import _init_tags, build_user_feature_vector, NUM_TAGS

    client = get_client()
    _init_tags()

    # ── Users
    users    = client.query("data_ml/universal:queryAll", {"table_name": "users"})
    user_ids = [u["_id"] for u in users]
    np.random.shuffle(user_ids)

    user_features = np.array(
        [build_user_feature_vector(uid) for uid in user_ids],
        dtype=np.float32,
    )

    # ── Events: build (num_tags + 4) feature vectors
    all_events = client.query("data_ml/universal:queryAll", {"table_name": "events"})

    event_rows = []
    for event in all_events:
        eid  = event["_id"]
        tags = np.zeros(NUM_TAGS, dtype=np.float32)

        event_tags = client.query("data_ml/eventRec:getByEventId", {"eventId": eid})
        from updateUserPreferences import TAG_ID_TO_IDX
        for row in event_tags:
            if row["tagId"] in TAG_ID_TO_IDX:
                tags[TAG_ID_TO_IDX[row["tagId"]]] = 1.0

        tag_count_norm = tags.sum() / 8.0
        day_norm       = float(event.get("dayOfWeek", 5)) / 6.0
        hour_norm      = float(event.get("startHour",  19)) / 23.0
        is_free        = float(event.get("isFree", False))

        event_rows.append(np.concatenate([tags, [tag_count_norm, day_norm, hour_norm, is_free]]))

    event_features = np.array(event_rows, dtype=np.float32)

    dataset = EventRecDataset(
        torch.from_numpy(user_features),
        torch.from_numpy(event_features),
    )
    return _make_loaders(dataset, batch_size)


def get_data_loader(mode: str = "offline", data_dir: str = "training/training_data/", batch_size: int = 64) -> tuple[DataLoader[EventRecDataset], DataLoader[EventRecDataset]]:
    """
    Args:
        mode:       "offline" (load from .npy files) | "online" (pull from Convex)
        data_dir:   path to directory containing .npy files (offline mode only)
        batch_size: DataLoader batch size

    Returns:
        (train_loader, test_loader)
    """
    if mode == "offline":
        return _load_offline(data_dir, batch_size)
    elif mode == "online":
        return _load_online(batch_size)
    else:
        raise ValueError(f"Unknown mode '{mode}'. Use 'offline' or 'online'.")