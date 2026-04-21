import os
import sys
import numpy as np
import pytest
import torch
from unittest.mock import patch, MagicMock

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "event-rec"))

from data.eventRecDataset import (
    EventRecDataset,
    _make_loaders,
    _load_offline,
    _load_online,
    get_data_loader,
)


# ------------------------------
#  FAKE MOCK DATA
# ------------------------------

@pytest.fixture
def sample_user_features() -> torch.Tensor:
    """Sample user features: (5 users, 3 * 10 tags)"""
    return torch.randn(5, 30, dtype=torch.float32)


@pytest.fixture
def sample_event_features() -> torch.Tensor:
    """Sample event features: (8 events, 10 tags + 4)"""
    return torch.randn(8, 14, dtype=torch.float32)


@pytest.fixture
def sample_triplets() -> torch.Tensor:
    """Sample triplets: (20, 3) - [user_idx, pos_event_idx, neg_event_idx]"""
    return torch.tensor([
        [0, 1, 2],
        [0, 3, 4],
        [1, 2, 5],
        [1, 6, 7],
        [2, 0, 1],
        [2, 3, 4],
        [3, 5, 6],
        [3, 1, 0],
        [4, 7, 2],
        [4, 4, 3],
        [0, 5, 1],
        [1, 0, 7],
        [2, 6, 2],
        [3, 2, 5],
        [4, 1, 6],
        [0, 7, 3],
        [1, 4, 1],
        [2, 2, 7],
        [3, 6, 4],
        [4, 0, 5],
    ], dtype=torch.long)


# ------------------------------
#  EventRecDataset
# ------------------------------

def test_eventRecDataset_init_with_triplets(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor, sample_triplets: torch.Tensor) -> None:
    """Test dataset initialization with triplets"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, sample_triplets)

    assert dataset.user_features.shape == sample_user_features.shape
    assert dataset.event_features.shape == sample_event_features.shape
    assert dataset.triplets.shape == sample_triplets.shape


def test_eventRecDataset_init_without_triplets(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor) -> None:
    """Test dataset initialization without triplets"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, triplets=None)

    assert dataset.user_features.shape == sample_user_features.shape
    assert dataset.event_features.shape == sample_event_features.shape
    assert dataset.triplets is None


def test_eventRecDataset_len_with_triplets(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor, sample_triplets: torch.Tensor) -> None:
    """Test __len__ returns triplet count when triplets provided"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, sample_triplets)
    assert len(dataset) == len(sample_triplets)


def test_eventRecDataset_len_without_triplets(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor) -> None:
    """Test __len__ returns user count when no triplets"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, triplets=None)
    assert len(dataset) == len(sample_user_features)


def test_eventRecDataset_getitem_with_triplets(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor, sample_triplets: torch.Tensor) -> None:
    """Test __getitem__ returns correct triplet when triplets provided"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, sample_triplets)

    user, pos, neg = dataset[0]

    assert user.shape == (30,)  # 3 * 10 tags
    assert pos.shape == (14,)  # 10 tags + 4
    assert neg.shape == (14,)

    u_idx, pos_idx, neg_idx = sample_triplets[0]
    assert torch.allclose(user, sample_user_features[u_idx])
    assert torch.allclose(pos, sample_event_features[pos_idx])
    assert torch.allclose(neg, sample_event_features[neg_idx])


def test_eventRecDataset_getitem_without_triplets(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor) -> None:
    """Test __getitem__ returns random events when no triplets"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, triplets=None)

    user, pos, neg = dataset[0]

    assert user.shape == (30,)
    assert pos.shape == (14,)
    assert neg.shape == (14,)
    assert torch.allclose(user, sample_user_features[0])


def test_eventRecDataset_returns_tensors(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor, sample_triplets: torch.Tensor) -> None:
    """Test __getitem__ returns torch.Tensor objects"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, sample_triplets)

    user, pos, neg = dataset[0]

    assert isinstance(user, torch.Tensor)
    assert isinstance(pos, torch.Tensor)
    assert isinstance(neg, torch.Tensor)


# ------------------------------
#  _make_loaders
# ------------------------------

def test_make_loaders_returns_tuple(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor, sample_triplets: torch.Tensor) -> None:
    """Test _make_loaders returns tuple of DataLoaders"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, sample_triplets)
    train_loader, test_loader = _make_loaders(dataset, batch_size=4)

    assert isinstance(train_loader, torch.utils.data.DataLoader)
    assert isinstance(test_loader, torch.utils.data.DataLoader)


def test_make_loaders_80_20_split(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor, sample_triplets: torch.Tensor) -> None:
    """Test _make_loaders uses 80/20 train/test split"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, sample_triplets)
    train_loader, test_loader = _make_loaders(dataset, batch_size=4)

    total_size = len(dataset)
    train_size = len(train_loader.dataset)
    test_size = len(test_loader.dataset)

    assert train_size + test_size == total_size
    assert train_size == int(0.8 * total_size)
    assert test_size == total_size - train_size


def test_make_loaders_batch_size(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor, sample_triplets: torch.Tensor) -> None:
    """Test _make_loaders respects batch_size parameter"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, sample_triplets)
    batch_size = 4
    train_loader, test_loader = _make_loaders(dataset, batch_size=batch_size)

    assert train_loader.batch_size == batch_size
    assert test_loader.batch_size == batch_size


def test_make_loaders_train_shuffled(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor, sample_triplets: torch.Tensor) -> None:
    """Test train loader has shuffle=True"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, sample_triplets)
    train_loader, _ = _make_loaders(dataset, batch_size=4)
    assert isinstance(train_loader.sampler, torch.utils.data.RandomSampler)


def test_make_loaders_test_not_shuffled(sample_user_features: torch.Tensor, sample_event_features: torch.Tensor, sample_triplets: torch.Tensor) -> None:
    """Test test loader has shuffle=False"""
    dataset = EventRecDataset(sample_user_features, sample_event_features, sample_triplets)
    _, test_loader = _make_loaders(dataset, batch_size=4)

    assert isinstance(test_loader.sampler, torch.utils.data.SequentialSampler)


# ------------------------------
#  _load_offline
# ------------------------------

@patch('data.eventRecDataset.np.load')
@patch('data.eventRecDataset.Path')
def test_load_offline_loads_correct_files(mock_path: MagicMock, mock_np_load: MagicMock) -> None:
    """Test _load_offline loads the three required .npy files"""
    # Setup mock
    mock_user_features = np.random.randn(5, 30).astype(np.float32)
    mock_event_features = np.random.randn(8, 14).astype(np.float32)
    mock_triplets = np.random.randint(0, 8, size=(20, 3)).astype(np.int64)

    mock_np_load.side_effect = [mock_user_features, mock_event_features, mock_triplets]

    train_loader, test_loader = _load_offline("training/training_data/", batch_size=4)
    assert mock_np_load.call_count == 3


@patch('data.eventRecDataset.np.load')
@patch('data.eventRecDataset.Path')
def test_load_offline_returns_loaders(mock_path: MagicMock, mock_np_load: MagicMock) -> None:
    """Test _load_offline returns DataLoader objects"""
    # Setup mock
    mock_user_features = np.random.randn(5, 30).astype(np.float32)
    mock_event_features = np.random.randn(8, 14).astype(np.float32)
    mock_triplets = np.random.randint(0, 8, size=(20, 3)).astype(np.int64)

    mock_np_load.side_effect = [mock_user_features, mock_event_features, mock_triplets]

    train_loader, test_loader = _load_offline("training/training_data/", batch_size=4)

    assert isinstance(train_loader, torch.utils.data.DataLoader)
    assert isinstance(test_loader, torch.utils.data.DataLoader)


@patch('data.eventRecDataset.np.load')
@patch('data.eventRecDataset.Path')
def test_load_offline_converts_to_torch(mock_path: MagicMock, mock_np_load: MagicMock) -> None:
    """Test _load_offline converts numpy arrays to torch tensors"""
    mock_user_features = np.random.randn(5, 30).astype(np.float32)
    mock_event_features = np.random.randn(8, 14).astype(np.float32)
    mock_triplets = np.array([
        [0, 1, 2],
        [1, 3, 4],
        [2, 5, 6],
        [3, 0, 7],
        [4, 2, 1],
    ], dtype=np.int64)

    mock_np_load.side_effect = [mock_user_features, mock_event_features, mock_triplets]

    train_loader, _ = _load_offline("training/training_data/", batch_size=4)

    # Get a batch and verify it's torch tensors
    user_feats, pos_feats, neg_feats = next(iter(train_loader))
    assert isinstance(user_feats, torch.Tensor)
    assert isinstance(pos_feats, torch.Tensor)
    assert isinstance(neg_feats, torch.Tensor)


# ------------------------------
#  get_data_loader
# ------------------------------

@patch('data.eventRecDataset._load_offline')
def test_get_data_loader_offline_mode(mock_load_offline: MagicMock) -> None:
    """Test get_data_loader calls _load_offline in offline mode"""
    mock_load_offline.return_value = (MagicMock(), MagicMock())

    get_data_loader(mode="offline", data_dir="training/training_data/", batch_size=32)

    mock_load_offline.assert_called_once_with("training/training_data/", 32)


@patch('data.eventRecDataset._load_online')
def test_get_data_loader_online_mode(mock_load_online: MagicMock) -> None:
    """Test get_data_loader calls _load_online in online mode"""
    mock_load_online.return_value = (MagicMock(), MagicMock())

    get_data_loader(mode="online", batch_size=32)

    mock_load_online.assert_called_once_with(32)


def test_get_data_loader_invalid_mode() -> None:
    """Test get_data_loader raises ValueError for invalid mode"""
    with pytest.raises(ValueError, match="Unknown mode"):
        get_data_loader(mode="invalid_mode")


@patch('data.eventRecDataset._load_offline')
def test_get_data_loader_default_mode(mock_load_offline: MagicMock) -> None:
    """Test get_data_loader defaults to offline mode"""
    mock_load_offline.return_value = (MagicMock(), MagicMock())

    get_data_loader()

    assert mock_load_offline.called


@patch('data.eventRecDataset._load_offline')
def test_get_data_loader_passes_batch_size(mock_load_offline: MagicMock) -> None:
    """Test get_data_loader passes batch_size to underlying functions"""
    mock_load_offline.return_value = (MagicMock(), MagicMock())

    get_data_loader(mode="offline", batch_size=128)

    call_args = mock_load_offline.call_args
    assert call_args[0][1] == 128


# ------------------------------
#  _load_online (basic tests)
# ------------------------------

@patch('utils.utils.get_client')
@patch('updateUserPreferences.init_tags')
@patch('updateUserPreferences.build_user_feature_vector')
def test_load_online_calls_init_tags(mock_build_vector: MagicMock, mock_init_tags: MagicMock, mock_get_client: MagicMock) -> None:
    """Test _load_online calls init_tags to initialize tag mappings"""
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.query.return_value = []

    try:
        _load_online(batch_size=32)
    except:
        pass

    mock_init_tags.assert_called_once()


@patch('utils.utils.get_client')
@patch('updateUserPreferences.init_tags')
@patch('updateUserPreferences.build_user_feature_vector')
def test_load_online_queries_users(mock_build_vector: MagicMock, mock_init_tags: MagicMock, mock_get_client: MagicMock) -> None:
    """Test _load_online queries users table"""
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    mock_client.query.return_value = [{"_id": "u1"}, {"_id": "u2"}]
    mock_build_vector.return_value = np.zeros(30, dtype=np.float32)

    try:
        _load_online(batch_size=32)
    except:
        pass

    # Check that users were queried
    calls = [call[0] for call in mock_client.query.call_args_list]
    assert any("users" in str(call) for call in calls)