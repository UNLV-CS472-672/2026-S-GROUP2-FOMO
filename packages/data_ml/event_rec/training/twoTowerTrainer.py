import torch
import torch.optim as optim
import torch.nn.functional as F
from models.twoTowerModel import UserTower, EventTower


class TwoTowerTrainer():
    def __init__(self, user_tower: UserTower, event_tower: EventTower, lr: float = 3e-4, epochs: int = 150):
        self.user_tower  = user_tower
        self.event_tower = event_tower

        self.optimizer = optim.Adam(list(self.user_tower.parameters()) + list(self.event_tower.parameters()), lr=lr, weight_decay=1e-5)

        self.scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            self.optimizer, T_max=epochs, eta_min=1e-5
        )

    def step_scheduler(self) -> None:
        self.scheduler.step()

    def bpr_loss(self, user_vec: torch.Tensor, pos_vec: torch.Tensor, neg_vec: torch.Tensor) -> torch.Tensor:
        pos_score = (user_vec * pos_vec).sum(dim=-1)
        neg_score = (user_vec * neg_vec).sum(dim=-1)
        return -F.logsigmoid(pos_score - neg_score).mean()

    def train(self, user_tags: torch.Tensor, pos_event_tags: torch.Tensor, neg_event_tags: torch.Tensor) -> float:
        self.optimizer.zero_grad()

        user_vec = self.user_tower(user_tags)
        pos_vec  = self.event_tower(pos_event_tags)
        neg_vec  = self.event_tower(neg_event_tags)

        loss: torch.Tensor = self.bpr_loss(user_vec, pos_vec, neg_vec)
        loss.backward() #type: ignore
        self.optimizer.step()

        return float(loss.item())