import torch

from models.twoTowerModel import UserTower, EventTower

from convex import ConvexClient
from dotenv import load_dotenv


def get_tag_count(client: ConvexClient) -> int:
    tags = client.query("data_ml/universal:queryAll", {"table_name": "tags"})
    return len(tags["_id"])


def main():
    user_tower = UserTower()
    event_tower = EventTower()

    model_weights = torch.load("./models/model.pth")


