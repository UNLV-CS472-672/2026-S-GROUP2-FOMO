import os
import sys
import numpy as np
import pytest
from unittest.mock import patch, MagicMock
from typing import Generator
import torch

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "event-rec", "models"))
from twoTowerModel import UserTower, EventTower

NUM_TAGS = 27
EMBED_DIM = 64
BATCH = 8


def test_user_tower_shape():
    tower = UserTower(num_tags=NUM_TAGS, hidden_dim=128, embed_dim=EMBED_DIM)
    x = torch.randn(BATCH, 3 * NUM_TAGS)
    out = tower(x)
    assert out.shape == (BATCH, EMBED_DIM)


def test_event_tower_shape():
    tower = EventTower(num_tags=NUM_TAGS, hidden_dim=128, embed_dim=EMBED_DIM)
    x = torch.randn(BATCH, NUM_TAGS + 4)
    out = tower(x)
    assert out.shape == (BATCH, EMBED_DIM)


def test_outputs_are_l2_normalized():
    user = UserTower(num_tags=NUM_TAGS)
    event = EventTower(num_tags=NUM_TAGS)
    u_out = user(torch.randn(BATCH, 3 * NUM_TAGS))
    e_out = event(torch.randn(BATCH, NUM_TAGS + 4))
    assert torch.allclose(u_out.norm(dim=-1), torch.ones(BATCH), atol=1e-5)
    assert torch.allclose(e_out.norm(dim=-1), torch.ones(BATCH), atol=1e-5)


def test_towers_produce_matching_embed_dim():
    """Required for cosine similarity in BPR loss."""
    user = UserTower(num_tags=NUM_TAGS, embed_dim=EMBED_DIM)
    event = EventTower(num_tags=NUM_TAGS, embed_dim=EMBED_DIM)
    u = user(torch.randn(1, 3 * NUM_TAGS))
    e = event(torch.randn(1, NUM_TAGS + 4))

    sim = (u * e).sum(dim=-1)
    assert sim.shape == (1,)


def test_gradients_flow():
    tower = UserTower(num_tags=NUM_TAGS)
    x = torch.randn(BATCH, 3 * NUM_TAGS, requires_grad=False)
    out = tower(x)
    loss = out.sum()
    loss.backward()
    for name, param in tower.named_parameters():
        assert param.grad is not None, f"{name} has no gradient"
        assert not torch.isnan(param.grad).any(), f"{name} has NaN gradient"