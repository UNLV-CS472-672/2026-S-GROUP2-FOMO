import torch
import torch.nn as nn
import torch.nn.functional as F


class UserTower(nn.Module):
    def __init__(self, num_tags: int, hidden_dim: int = 128, embed_dim: int = 64) -> None:
        """
        (batch. num_tags * 3)
        [attended_weights | interested_weights | blocked_weights] from data/updateUserPreferences.py
        """
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
    (batch. num_tags + 4)
    num_tags: number of tags
    num_tags + 0: tag_count_norm  (num active tags / max_tags)
    num_tags + 1: day_of_week_norm (0=Mon, 6=Sun → divided by 6)
    num_tags + 2: start hour (0-23)
    num_tags + 3: is_free (0, 1)
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