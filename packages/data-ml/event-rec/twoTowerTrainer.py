import torch
import torch.optim as optim
import torch.nn.functional as F

class TwoTowerTrainer():
    def __init__(self, user_tower, event_tower, lr=3e-3):
        self.user_tower = user_tower
        self.event_tower = event_tower

        self.optimizer = optim.Adam(list(self.user_tower.parameters()) +
                                    list(self.event_tower.parameters())
                                    , lr=lr)

    def bpr_loss(self, user_vec, pos_vec, neg_vec):
        pos_score = (user_vec * pos_vec).sum(dim=-1)
        neg_score = (user_vec * neg_vec).sum(dim=-1)

        return -F.logsigmoid(pos_score - neg_score).mean()

    def train(self, user_tags, pos_event_tags, neg_event_tags):
        self.optimizer.zero_grad()

        user_vec = self.user_tower(user_tags)
        pos_vec = self.event_tower(pos_event_tags)
        neg_vec = self.event_tower(neg_event_tags)

        loss = self.bpr_loss(user_vec, pos_vec, neg_vec)
        loss.backward()
        self.optimizer.step()

        return loss.item()