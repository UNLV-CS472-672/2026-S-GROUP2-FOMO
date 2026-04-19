import torch
from pathlib import Path

from models.twoTowerModel import UserTower, EventTower
from training.twoTowerTrainer import TwoTowerTrainer
from data.eventRecDataset import get_data_loader

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def main(epochs: int = 150, model_path: str | None = None) -> None:
    train_loader, test_loader = get_data_loader()

    user_feats, event_feats, _ = next(iter(train_loader))

    # user_feats  : (batch, 3 * num_tags)
    # event_feats : (batch, num_tags + 4)
    num_tags = event_feats.shape[1] - 4

    user_tower = UserTower(num_tags=num_tags).to(DEVICE)
    event_tower = EventTower(num_tags=num_tags).to(DEVICE)

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
            print(f"Partial load complete")
    else:
        print("Training from scratch")

    trainer = TwoTowerTrainer(user_tower, event_tower, epochs=epochs)

    best_eval_loss = float("inf")
    best_state = None

    def save_model(epochs_completed: int, tag: str = "") -> None:
        models_dir = Path("models")
        models_dir.mkdir(exist_ok=True)
        existing = len(list(models_dir.glob("model*.pt")))
        save_path = models_dir / f"model{existing + 1}{tag}.pt"
        torch.save({
            'user_tower': user_tower.state_dict(),
            'event_tower': event_tower.state_dict(),
            'num_tags': num_tags,
            'epochs': epochs_completed,
        }, save_path)
        print(f"Model saved to {save_path}")

    try:
        for epoch in range(epochs):
            # Training
            user_tower.train()
            event_tower.train()

            total_loss = 0.0
            for user_feats, pos_feats, neg_feats in train_loader:
                user_feats = user_feats.to(DEVICE)
                pos_feats = pos_feats.to(DEVICE)
                neg_feats = neg_feats.to(DEVICE)

                loss = trainer.train(user_feats, pos_feats, neg_feats)
                total_loss += loss

            avg_loss = total_loss / len(train_loader)

            # Eval
            user_tower.eval()
            event_tower.eval()

            eval_loss = 0.0
            with torch.no_grad():
                for user_feats, pos_feats, neg_feats in test_loader:
                    user_feats = user_feats.to(DEVICE)
                    pos_feats = pos_feats.to(DEVICE)
                    neg_feats = neg_feats.to(DEVICE)

                    user_vec = user_tower(user_feats)
                    pos_vec = event_tower(pos_feats)
                    neg_vec = event_tower(neg_feats)
                    eval_loss += trainer.bpr_loss(user_vec, pos_vec, neg_vec).item()

            avg_eval = eval_loss / len(test_loader)
            current_lr = trainer.optimizer.param_groups[0]['lr']
            print(f"Epoch {epoch + 1}/{epochs} | train: {avg_loss:.4f} | test: {avg_eval:.4f} | lr: {current_lr:.2e}")

            # Step scheduler after eval each epoch
            trainer.step_scheduler()

            # Save best checkpoint
            if avg_eval < best_eval_loss:
                best_eval_loss = avg_eval
                best_state = {
                    'user_tower': {k: v.clone() for k, v in user_tower.state_dict().items()},
                    'event_tower': {k: v.clone() for k, v in event_tower.state_dict().items()},
                }

        # Restore best weights before final save
        if best_state is not None:
            user_tower.load_state_dict(best_state['user_tower'])
            event_tower.load_state_dict(best_state['event_tower'])
            print(f"\nRestored best checkpoint (eval loss: {best_eval_loss:.4f})")

        save_model(epochs)

    except KeyboardInterrupt:
        print("\nInterrupted — saving current model state...")
        if best_state is not None:
            user_tower.load_state_dict(best_state['user_tower'])
            event_tower.load_state_dict(best_state['event_tower'])
        save_model(epoch + 1, tag="_interrupted")


if __name__ == "__main__":
    main(model_path=None)