import torch
from pathlib import Path
from dotenv import load_dotenv

from models.twoTowerModel import UserTower, EventTower
from training.twoTowerTrainer import TwoTowerTrainer
from data.eventRecDataset import get_data_loader

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def main(epochs: int = 100, model_path: str | None = None) -> None:
    train_loader, test_loader = get_data_loader()

    user_tags, _, _ = next(iter(train_loader))
    num_tags = user_tags.shape[1]

    user_tower = UserTower(input_dim=num_tags).to(DEVICE)
    event_tower = EventTower(input_dim=num_tags).to(DEVICE)

    if model_path is not None:
        checkpoint = torch.load(model_path, map_location=DEVICE)
        try:
            user_tower.load_state_dict(checkpoint['user_tower'])
            event_tower.load_state_dict(checkpoint['event_tower'])
            print(f"Loaded model from {model_path}")
        except RuntimeError as e:
            print(f"Full load failed ({e}), attempting partial load...")
            def partial_load(model, saved_state):
                model_state = model.state_dict()
                compatible = {
                    k: v for k, v in saved_state.items()
                    if k in model_state and v.shape == model_state[k].shape
                }
                model_state.update(compatible)
                model.load_state_dict(model_state)
                skipped = set(saved_state) - set(compatible)
                if skipped:
                    print(f"  Skipped incompatible keys: {skipped}")
            partial_load(user_tower, checkpoint['user_tower'])
            partial_load(event_tower, checkpoint['event_tower'])
            print(f"Partial load from {model_path} complete")
    else:
        print("Training from scratch")

    trainer = TwoTowerTrainer(user_tower, event_tower)

    def save_model(epochs_completed: int) -> None:
        models_dir = Path("models")
        existing = len(list(models_dir.glob("model*.pt")))
        save_path = models_dir / f"model{existing + 1}.pt"
        torch.save({
            'user_tower': user_tower.state_dict(),
            'event_tower': event_tower.state_dict(),
            'num_tags': num_tags,
            'epochs': epochs_completed,
        }, save_path)
        print(f"Model saved to {save_path}")

    try:
        for epoch in range(epochs):
            # --- training ---
            total_loss = 0.0
            for user_tags, pos_event_tags, neg_event_tags in train_loader:
                user_tags = user_tags.to(DEVICE)
                pos_event_tags = pos_event_tags.to(DEVICE)
                neg_event_tags = neg_event_tags.to(DEVICE)

                loss = trainer.train(user_tags, pos_event_tags, neg_event_tags)
                total_loss += loss

            avg_loss = total_loss / len(train_loader)

            # --- evaluation ---
            eval_loss = 0.0
            with torch.no_grad():
                user_tower.eval()
                for user_tags, pos_event_tags, neg_event_tags in test_loader:
                    user_tags = user_tags.to(DEVICE)
                    pos_event_tags = pos_event_tags.to(DEVICE)
                    neg_event_tags = neg_event_tags.to(DEVICE)

                    user_vec = user_tower(user_tags)
                    pos_vec = event_tower(pos_event_tags)
                    neg_vec = event_tower(neg_event_tags)
                    eval_loss += trainer.bpr_loss(user_vec, pos_vec, neg_vec).item()
                user_tower.train()

            avg_eval = eval_loss / len(test_loader)
            print(f"Epoch {epoch + 1}/{epochs} | train loss: {avg_loss:.4f} | test loss: {avg_eval:.4f}")

        save_model(epochs)

    except KeyboardInterrupt:
        print("\nInterrupted — saving current model state...")
        save_model(epoch + 1)

if __name__ == "__main__":
    main(model_path="models/model15.pt")