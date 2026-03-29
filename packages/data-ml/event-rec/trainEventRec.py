import os
import torch
import numpy as np
from dotenv import load_dotenv

from twoTowerModel import UserTower, EventTower
from twoTowerTrainer import TwoTowerTrainer
from eventRecDataset import get_data_loader


load_dotenv()

CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
if CONVEX_CLOUD_URL is None:
    raise EnvironmentError("CONVEX_CLOUD_URL not set")

client = ConvexClient(CONVEX_CLOUD_URL)


def main(epochs: int = 10) -> None:
    train_loader, test_loader = get_data_loader()

    user_tags, _, _ = next(iter(train_loader))
    num_tags = user_tags.shape[1]

    user_tower = UserTower(input_dim=num_tags)
    event_tower = EventTower(input_dim=num_tags)

    trainer = TwoTowerTrainer(user_tower, event_tower)

    for epoch in range(epochs):
        # --- training ---
        total_loss = 0.0
        for user_tags, pos_event_tags, neg_event_tags in train_loader:
            loss = trainer.train(user_tags, pos_event_tags, neg_event_tags)
            total_loss += loss

        avg_loss = total_loss / len(train_loader)

        # --- evaluation ---
        eval_loss = 0.0
        with torch.no_grad():
            for user_tags, pos_event_tags, neg_event_tags in test_loader:
                user_vec = user_tower(user_tags)
                pos_vec = event_tower(pos_event_tags)
                neg_vec = event_tower(neg_event_tags)
                eval_loss += trainer.bpr_loss(user_vec, pos_vec, neg_vec).item()

        avg_eval = eval_loss / len(test_loader)
        print(f"Epoch {epoch + 1}/{epochs} | train loss: {avg_loss:.4f} | test loss: {avg_eval:.4f}")


if __name__ == "__main__":
    main()