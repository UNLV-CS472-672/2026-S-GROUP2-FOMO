import os
import sys
import numpy as np
import pytest
from unittest.mock import patch, MagicMock
from typing import Generator
from pathlib import Path
import torch

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "event-rec"))

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

@patch('train.torch.save')
@patch('train.Path.mkdir')
@patch('train.Path.glob')
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
    assert saved_dict['num_tags'] == 10
    assert saved_dict['epochs'] == 150


@patch('train.torch.save')
@patch('train.Path.mkdir')
@patch('train.Path.glob')
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


@patch('train.torch.save')
@patch('train.Path.mkdir')
@patch('train.Path.glob')
def test_save_model_with_tag(mock_glob, mock_mkdir, mock_torch_save, towers):
    mock_glob.return_value = []

    user_tower, event_tower = towers

    save_model(95, user_tower, event_tower, NUM_TAGS, tag="_interrupted")
    save_path = mock_torch_save.call_args[0][1]
    assert save_path == Path("models") / "model1_interrupted.pt"


@patch('train.torch.save')
@patch('train.Path.mkdir')
@patch('train.Path.glob')
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
@patch('training.trainEventRec.TwoTowerTrainer')
@patch('training.trainEventRec.get_data_loader')
@patch('training.trainEventRec.UserTower')
@patch('training.trainEventRec.EventTower')
def test_main_trains_from_scratch(mock_event_tower, mock_user_tower, mock_get_data_loader, mock_trainer_class, mock_save_model, batch, towers):
    # Setup mock data loader
    mock_train_loader = MagicMock()
    mock_test_loader = MagicMock()
    mock_get_data_loader.return_value = (mock_train_loader, mock_test_loader)

    user_feats, pos_feats, neg_feats = batch

    mock_train_loader.__iter__.return_value = iter([(user_feats, pos_feats, neg_feats)])
    mock_train_loader.__len__.return_value = 1
    mock_test_loader.__iter__.return_value = iter([(user_feats, pos_feats, neg_feats)])
    mock_test_loader.__len__.return_value = 1

    user_tower, event_tower = towers
    mock_user_tower.return_value = user_tower
    mock_event_tower.return_value = event_tower

    # Mock trainer
    mock_trainer_instance = MagicMock()
    mock_trainer_instance.train.return_value = 0.5
    mock_trainer_instance.bpr_loss.return_value = torch.tensor(0.4)
    mock_trainer_instance.optimizer.param_groups = [{'lr': 0.001}]
    mock_trainer_class.return_value = mock_trainer_instance

    main(epochs=1, model_path=None)

    # Verify training happened
    assert mock_trainer_instance.train.called
    assert mock_trainer_instance.step_scheduler.called
    assert mock_save_model.called


@patch('training.trainEventRec.save_model')
@patch('training.trainEventRec.torch.load')
@patch('training.trainEventRec.TwoTowerTrainer')
@patch('training.trainEventRec.get_data_loader')
@patch('training.trainEventRec.UserTower')
@patch('training.trainEventRec.EventTower')
def test_main_loads_checkpoint(mock_event_tower, mock_user_tower, mock_get_data_loader, mock_trainer_class, mock_torch_load, mock_save_model, batch, towers):
    mock_train_loader = MagicMock()
    mock_test_loader = MagicMock()
    mock_get_data_loader.return_value = (mock_train_loader, mock_test_loader)

    user_feats, pos_feats, neg_feats = batch

    mock_train_loader.__iter__.return_value = iter([(user_feats, pos_feats, neg_feats)])
    mock_train_loader.__len__.return_value = 1
    mock_test_loader.__iter__.return_value = iter([(user_feats, pos_feats, neg_feats)])
    mock_test_loader.__len__.return_value = 1

    # Mock checkpoint
    mock_torch_load.return_value = {
        'user_tower': {'fc1.weight': torch.randn(128, 81)},  # Use actual dimensions
        'event_tower': {'fc1.weight': torch.randn(128, 31)},
        'num_tags': NUM_TAGS,
        'epochs': 50
    }

    user_tower, event_tower = towers
    mock_user_tower.return_value = user_tower
    mock_event_tower.return_value = event_tower

    mock_trainer_instance = MagicMock()
    mock_trainer_instance.train.return_value = 0.5
    mock_trainer_instance.bpr_loss.return_value = torch.tensor(0.4)
    mock_trainer_instance.optimizer.param_groups = [{'lr': 0.001}]
    mock_trainer_class.return_value = mock_trainer_instance

    # Run with checkpoint
    main(epochs=1, model_path="models/model1.pt")

    # Verify checkpoint was loaded
    mock_torch_load.assert_called_once_with("models/model1.pt", map_location=torch.device('cpu'))
    mock_user_tower.return_value.load_state_dict.assert_called_once()
    mock_event_tower.return_value.load_state_dict.assert_called_once()