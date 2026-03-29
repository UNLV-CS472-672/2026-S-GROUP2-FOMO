import numpy as np
import torch

from twoTowerModel import UserTower, EventTower
from twoTowerTrainer import TwoTowerTrainer

def load_users(user: list[str]) -> torch.Tensor:
