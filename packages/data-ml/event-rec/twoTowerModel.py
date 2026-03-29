import torch
import torch.nn as nn
import torch.nn.functional as F

class UserTower(nn.Module):
    def __init__(self, input_dim, hidden_dim=128, embed_dim=64):
        super().__init__()

        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, embed_dim),
        )

    def forward(self, user_input):
        x = self.mlp(user_input)
        return F.normalize(x, dim=-1)


class EventTower(nn.Module):
    def __init__(self, input_dim, hidden_dim=128, embed_dim=64):
        super().__init__()

        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, embed_dim),
        )

    def forward(self, event_input):
        x = self.mlp(event_input)
        return F.normalize(x, dim=-1)


class TwoTower(nn.Module):
    def __init__(self, input_dim, hidden_dim=128, embed_dim=64):
        super().__init__()
        self.user_tower = UserTower(input_dim, hidden_dim, embed_dim)
        self.event_tower = EventTower(input_dim, hidden_dim, embed_dim)

    def forward(self, user_input, event_input):
        user_embed = self.user_tower(user_input)
        event_embed = self.event_tower(event_input)

        return torch.matmul(user_embed, event_embed.T)