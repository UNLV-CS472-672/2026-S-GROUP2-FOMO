import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
import torch

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "event_rec"))

from training.twoTowerTrainer import TwoTowerTrainer
from models.twoTowerModel import UserTower, EventTower
from training.trainEventRec import save_model, main

BATCH = 8
NUM_TAGS = 27

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
#  save_model()
# ------------------------------

@patch('training.trainEventRec.torch.save')
@patch('training.trainEventRec.Path.mkdir')
@patch('training.trainEventRec.Path.glob')
def test_save_model_creates_first_file(mock_glob, mock_mkdir, mock_torch_save, towers):
    # Setup: no existing models
    mock_glob.return_value = []

    # Create dummy towers
    user_tower, event_tower = towers

    # Call function
    save_model(150, user_tower, event_tower, NUM_TAGS)

    # Verify mkdir was called
    mock_mkdir.assert_called_once_with(exist_ok=True)

    # Verify torch.save was called with correct path
    assert mock_torch_save.call_count == 1
    save_path = mock_torch_save.call_args[0][1]
    assert save_path == Path("models") / "model1.pt"

    # Verify saved dict structure
    saved_dict = mock_torch_save.call_args[0][0]
    assert 'user_tower' in saved_dict
    assert 'event_tower' in saved_dict
    assert saved_dict['num_tags'] == NUM_TAGS
    assert saved_dict['epochs'] == 150


@patch('training.trainEventRec.torch.save')
@patch('training.trainEventRec.Path.mkdir')
@patch('training.trainEventRec.Path.glob')
def test_save_model_increments_filename(mock_glob, mock_mkdir, mock_torch_save, towers):
    mock_glob.return_value = [
        Path("models/model1.pt"),
        Path("models/model2.pt"),
        Path("models/model3.pt")
    ]

    user_tower, event_tower = towers

    save_model(150, user_tower, event_tower, NUM_TAGS)
    save_path = mock_torch_save.call_args[0][1]
    assert save_path == Path("models") / "model4.pt"


@patch('training.trainEventRec.torch.save')
@patch('training.trainEventRec.Path.mkdir')
@patch('training.trainEventRec.Path.glob')
def test_save_model_with_tag(mock_glob, mock_mkdir, mock_torch_save, towers):
    mock_glob.return_value = []

    user_tower, event_tower = towers

    save_model(95, user_tower, event_tower, NUM_TAGS, tag="_interrupted")
    save_path = mock_torch_save.call_args[0][1]
    assert save_path == Path("models") / "model1_interrupted.pt"


@patch('training.trainEventRec.torch.save')
@patch('training.trainEventRec.Path.mkdir')
@patch('training.trainEventRec.Path.glob')
def test_save_model_state_dict_called(mock_glob, mock_mkdir, mock_torch_save, towers):
    mock_glob.return_value = []

    user_tower, event_tower = towers

    with patch.object(user_tower, 'state_dict', return_value={'user_param': 'value1'}), \
            patch.object(event_tower, 'state_dict', return_value={'event_param': 'value2'}):
        save_model(150, user_tower, event_tower, num_tags=10)

        saved_dict = mock_torch_save.call_args[0][0]
        assert saved_dict['user_tower'] == {'user_param': 'value1'}
        assert saved_dict['event_tower'] == {'event_param': 'value2'}


# ------------------------------
#  main()
# ------------------------------

@patch('training.trainEventRec.save_model')
@patch('training.trainEventRec.get_data_loader')
def test_main_trains_from_scratch(mock_get_data_loader, mock_save_model, batch):
    """Test main() training loop - use minimal mocking"""
    # Setup mock data loader
    mock_train_loader = MagicMock()
    mock_test_loader = MagicMock()
    mock_get_data_loader.return_value = (mock_train_loader, mock_test_loader)

    user_feats, pos_feats, neg_feats = batch

    mock_train_loader.__iter__.return_value = iter([(user_feats, pos_feats, neg_feats)])
    mock_train_loader.__len__.return_value = 1
    mock_test_loader.__iter__.return_value = iter([(user_feats, pos_feats, neg_feats)])
    mock_test_loader.__len__.return_value = 1

    # Run with 1 epoch
    main(epochs=1, model_path=None)

    # verify save was called
    assert mock_save_model.called
    call_args = mock_save_model.call_args[0]
    assert call_args[0] == 1  # epochs_completed
    assert call_args[3] == NUM_TAGS  # num_tags


@patch('training.trainEventRec.save_model')
@patch('training.trainEventRec.get_data_loader')
def test_main_loads_checkpoint(mock_get_data_loader, mock_save_model, batch, tmp_path):
    """Test main() loads checkpoint correctly"""
    mock_train_loader = MagicMock()
    mock_test_loader = MagicMock()
    mock_get_data_loader.return_value = (mock_train_loader, mock_test_loader)

    user_feats, pos_feats, neg_feats = batch

    mock_train_loader.__iter__.return_value = iter([(user_feats, pos_feats, neg_feats)])
    mock_train_loader.__len__.return_value = 1
    mock_test_loader.__iter__.return_value = iter([(user_feats, pos_feats, neg_feats)])
    mock_test_loader.__len__.return_value = 1

    checkpoint_path = tmp_path / "test_model.pt"
    user_tower = UserTower(NUM_TAGS)
    event_tower = EventTower(NUM_TAGS)

    torch.save({
        'user_tower': user_tower.state_dict(),
        'event_tower': event_tower.state_dict(),
        'num_tags': NUM_TAGS,
        'epochs': 50
    }, checkpoint_path)

    # Run with checkpoint
    main(epochs=1, model_path=str(checkpoint_path))

    # Verify save was called (indicates training completed)
    assert mock_save_model.called