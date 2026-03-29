import torch
import torch.optim as optim

class PairwiseRankingTrainer():
    def __init__(self, user_tower, event_tower, lr=3e-3):
        self.user_tower = user_tower
        self.event_tower = event_tower

        self.optimizer = optim.Adam(list(self.user_tower.parameters()) +
                                    list(self.event_tower.parameters())
                                    , lr=lr)

    def bpr_loss(self):

    def train(self, user_tags, pos_event_tags, neg_event_tags):
