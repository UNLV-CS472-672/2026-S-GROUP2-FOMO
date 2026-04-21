import os
import sys
import pytest
import torch

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "event-rec"))

from training.twoTowerTrainer import TwoTowerTrainer
from models.twoTowerModel import UserTower, EventTower

NUM_TAGS = 27
BATCH = 8


# ------------------------------
#  FAKE MOCK DATA
# ------------------------------

@pytest.fixture
def towers():
    """Fresh towers for each test — prevents state leakage between tests."""
    return UserTower(NUM_TAGS), EventTower(NUM_TAGS)


@pytest.fixture
def trainer(towers):
    user_tower, event_tower = towers
    return TwoTowerTrainer(user_tower, event_tower, lr=1e-4, epochs=150)


@pytest.fixture
def batch():
    """Synthetic training batch."""
    user_tags = torch.randn(BATCH, 3 * NUM_TAGS)
    pos_tags = torch.randn(BATCH, NUM_TAGS + 4)
    neg_tags = torch.randn(BATCH, NUM_TAGS + 4)
    return user_tags, pos_tags, neg_tags



# ------------------------------
#  test __init__
# ------------------------------

def test_init_stores_towers(towers):
    user_tower, event_tower = towers
    trainer = TwoTowerTrainer(user_tower, event_tower)
    assert trainer.user_tower is user_tower
    assert trainer.event_tower is event_tower


def test_init_optimizer_has_both_towers_params(trainer, towers):
    """Both tower params must be in the optimizer, or one tower won't train."""
    user_tower, event_tower = towers
    optimizer_params = {id(p) for group in trainer.optimizer.param_groups for p in group['params']}
    user_params = {id(p) for p in user_tower.parameters()}
    event_params = {id(p) for p in event_tower.parameters()}

    assert user_params.issubset(optimizer_params), "user tower params missing from optimizer"
    assert event_params.issubset(optimizer_params), "event tower params missing from optimizer"

def test_init_uses_custom_lr(towers):
    user_tower, event_tower = towers
    trainer = TwoTowerTrainer(user_tower, event_tower, lr=5e-5)
    assert trainer.optimizer.param_groups[0]['lr'] == 5e-5

# ------------------------------
#  step_scheduler()
# ------------------------------

@pytest.mark.filterwarnings("ignore::UserWarning")
def test_step_scheduler_decreases_lr(trainer):
    initial_lr = trainer.optimizer.param_groups[0]['lr']
    trainer.step_scheduler()
    new_lr = trainer.optimizer.param_groups[0]['lr']

    assert new_lr < initial_lr

@pytest.mark.filterwarnings("ignore::UserWarning")
def test_step_scheduler_reaches_eta_min(towers):
    user_tower, event_tower = towers
    epochs = 10
    trainer = TwoTowerTrainer(user_tower, event_tower, lr=1e-4, epochs=epochs)

    for _ in range(epochs):
        trainer.step_scheduler()

    assert trainer.optimizer.param_groups[0]['lr'] == pytest.approx(1e-5, rel=1e-3)

# ------------------------------
#  bpr_loss()
# ------------------------------

def test_bpr_loss_returns_scalar(trainer):
    user = torch.randn(BATCH, 64)
    pos = torch.randn(BATCH, 64)
    neg = torch.randn(BATCH, 64)
    loss = trainer.bpr_loss(user, pos, neg)
    assert loss.dim() == 0, "loss should be a scalar"


def test_bpr_loss_is_non_negative(trainer):
    """-log(sigmoid(x)) >= 0 for all x."""
    user = torch.randn(BATCH, 64)
    pos = torch.randn(BATCH, 64)
    neg = torch.randn(BATCH, 64)
    loss = trainer.bpr_loss(user, pos, neg)
    assert loss.item() >= 0


def test_bpr_loss_prefers_positive_alignment(trainer):
    """Loss should be lower when pos is more aligned with user than neg."""
    user = torch.tensor([[1.0, 0.0, 0.0]])
    aligned = torch.tensor([[1.0, 0.0, 0.0]])
    orthogonal = torch.tensor([[0.0, 1.0, 0.0]])

    loss_correct = trainer.bpr_loss(user, aligned, orthogonal).item()
    loss_swapped = trainer.bpr_loss(user, orthogonal, aligned).item()

    assert loss_correct < loss_swapped


def test_bpr_loss_equal_scores_gives_log2(trainer):
    """When pos and neg have identical scores, loss = -log(0.5) = log(2)."""
    user = torch.tensor([[1.0, 0.0]])
    same = torch.tensor([[1.0, 0.0]])
    loss = trainer.bpr_loss(user, same, same).item()
    assert loss == pytest.approx(torch.log(torch.tensor(2.0)).item(), abs=1e-5)

# ------------------------------
#  train()
# ------------------------------

def test_train_returns_float_loss(trainer, batch):
    user_tags, pos_tags, neg_tags = batch
    loss = trainer.train(user_tags, pos_tags, neg_tags)
    assert isinstance(loss, float)
    assert loss >= 0


def test_train_updates_parameters(trainer, batch):
    """Parameters should change after a training step."""
    user_tags, pos_tags, neg_tags = batch
    params_before = [p.clone().detach() for p in trainer.user_tower.parameters()]

    trainer.train(user_tags, pos_tags, neg_tags)

    params_after = list(trainer.user_tower.parameters())
    changed = any(
        not torch.equal(before, after)
        for before, after in zip(params_before, params_after)
    )
    assert changed, "training step did not update any parameters"


def test_train_reduces_loss_over_steps(trainer, batch):
    """Overfitting on a fixed batch should reduce loss."""
    user_tags, pos_tags, neg_tags = batch

    initial_loss = trainer.train(user_tags, pos_tags, neg_tags)
    for _ in range(50):
        final_loss = trainer.train(user_tags, pos_tags, neg_tags)

    assert final_loss < initial_loss


def test_train_gradients_flow_to_both_towers(trainer, batch):
    """Both towers must receive gradients, otherwise one stops learning."""
    user_tags, pos_tags, neg_tags = batch
    trainer.train(user_tags, pos_tags, neg_tags)

    for name, param in trainer.user_tower.named_parameters():
        assert param.grad is not None, f"user_tower.{name} has no gradient"
        assert not torch.isnan(param.grad).any(), f"user_tower.{name} has NaN gradient"

    for name, param in trainer.event_tower.named_parameters():
        assert param.grad is not None, f"event_tower.{name} has no gradient"
        assert not torch.isnan(param.grad).any(), f"event_tower.{name} has NaN gradient"