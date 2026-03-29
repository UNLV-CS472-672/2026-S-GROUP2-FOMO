import torch
import torch.nn as nn
import torch.nn.functional as F

class UserTower(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 128, embed_dim: int = 64):
        super().__init__()

        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, embed_dim),
        )

    def forward(self, user_input: torch.Tensor) -> torch.Tensor:
        x = self.mlp(user_input)
        return F.normalize(x, dim=-1)


class EventTower(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 128, embed_dim:int = 64):
        super().__init__()

        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, embed_dim),
        )

    def forward(self, event_input: torch.Tensor) -> torch.Tensor:
        x = self.mlp(event_input)
        return F.normalize(x, dim=-1)