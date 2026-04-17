import torch
import torch.nn as nn
import torch.nn.functional as F


class UserTower(nn.Module):
    """
    Input: (batch, 3 * num_tags)
      - slice [0          : num_tags]   → attended tag weights
      - slice [num_tags   : 2*num_tags] → interested tag weights
      - slice [2*num_tags : 3*num_tags] → blocked tag weights

    Output: (batch, embed_dim) — L2-normalized
    """
    def __init__(self, num_tags: int, hidden_dim: int = 128, embed_dim: int = 64) -> None:
        super().__init__()
        self.num_tags  = num_tags
        input_dim = 3 * num_tags
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, embed_dim),
        )

    def forward(self, user_input: torch.Tensor) -> torch.Tensor:
        return F.normalize(self.mlp(user_input), dim=-1)


class EventTower(nn.Module):
    """
    Input: (batch, num_tags + 4)
      - [:num_tags]   → tag multihot
      - [num_tags+0]  → tag_count_norm  (num active tags / max_tags)
      - [num_tags+1]  → day_of_week_norm (0=Mon, 6=Sun → divided by 6)
      - [num_tags+2]  → hour_norm (0–23 → divided by 23)
      - [num_tags+3]  → is_free (0 or 1)

    Output: (batch, embed_dim) — L2-normalized
    """
    def __init__(self, num_tags: int, hidden_dim: int = 128, embed_dim: int = 64) -> None:
        super().__init__()
        self.num_tags = num_tags
        input_dim     = num_tags + 4
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, embed_dim),
        )

    def forward(self, event_input: torch.Tensor) -> torch.Tensor:
        return F.normalize(self.mlp(event_input), dim=-1)