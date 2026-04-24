import pytest
import torch
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from typing import Any, Dict, List, Optional

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from recommendEvent import (
    get_tag_info,
    get_user_features,
    get_event_features,
    log,
    main,
    MAX_TAGS
)


@pytest.fixture
def mock_convex_client() -> Mock:
    """Mock ConvexClient for testing"""
    client = Mock()
    return client


@pytest.fixture
def sample_tags() -> List[Dict[str, Any]]:
    """Sample tag data"""
    return [
        {"_id": "tag1", "name": "Music"},
        {"_id": "tag2", "name": "Sports"},
        {"_id": "tag3", "name": "Food"},
    ]


@pytest.fixture
def sample_users() -> List[Dict[str, Any]]:
    """Sample user data"""
    return [
        {"_id": "user1", "name": "Alice"},
        {"_id": "user2", "name": "Bob"},
    ]


@pytest.fixture
def sample_events() -> List[Dict[str, Any]]:
    """Sample event data"""
    return [
        {
            "_id": "event1",
            "name": "Concert",
            "dayOfWeek": 5,
            "startHour": 19,
            "isFree": False
        },
        {
            "_id": "event2",
            "name": "Basketball Game",
            "dayOfWeek": 6,
            "startHour": 14,
            "isFree": True
        },
    ]


@pytest.fixture
def sample_event_tags() -> Dict[str, List[Dict[str, Any]]]:
    """Sample event-tag relationships"""
    return {
        "event1": [{"tagId": "tag1"}],
        "event2": [{"tagId": "tag2"}],
    }


@pytest.fixture
def sample_interactions() -> Dict[str, List[Dict[str, Any]]]:
    """Sample user-event interactions"""
    return {
        "user1": [
            {"eventId": "event1", "interactionType": "attended"},
            {"eventId": "event2", "interactionType": "blocked"},
        ],
        "user2": []
    }


class TestGetTagInfo:
    """Tests for get_tag_info function"""

    def test_returns_correct_num_tags(
        self, mock_convex_client: Mock, sample_tags: List[Dict[str, Any]]
    ) -> None:
        """Test that get_tag_info returns correct number of tags"""
        mock_convex_client.query.return_value = sample_tags

        num_tags, tag_id_to_idx = get_tag_info(mock_convex_client)

        assert num_tags == 3
        assert len(tag_id_to_idx) == 3

    def test_creates_correct_tag_mapping(
        self, mock_convex_client: Mock, sample_tags: List[Dict[str, Any]]
    ) -> None:
        """Test that tag ID to index mapping is correct"""
        mock_convex_client.query.return_value = sample_tags

        num_tags, tag_id_to_idx = get_tag_info(mock_convex_client)

        assert tag_id_to_idx["tag1"] == 0
        assert tag_id_to_idx["tag2"] == 1
        assert tag_id_to_idx["tag3"] == 2

    def test_empty_tags(self, mock_convex_client: Mock) -> None:
        """Test behavior with no tags"""
        mock_convex_client.query.return_value = []

        num_tags, tag_id_to_idx = get_tag_info(mock_convex_client)

        assert num_tags == 0
        assert len(tag_id_to_idx) == 0


class TestLog:
    def test_log_prints_timestamped_message(self) -> None:
        with patch("recommendEvent.datetime") as mock_datetime, patch("recommendEvent.print") as mock_print:
            mock_now = MagicMock()
            mock_now.strftime.return_value = "12:34:56 01/02/26"
            mock_datetime.now.return_value = mock_now

            log("hello world")

        mock_print.assert_called_once_with("[12:34:56 01/02/26] hello world")


class TestGetUserFeatures:
    """Tests for get_user_features function"""

    def test_returns_correct_shape(self, mock_convex_client: Mock) -> None:
        """Test that user features have correct shape"""
        num_tags = 5
        users = ["user1", "user2"]
        expected_dim = 3 * num_tags

        mock_convex_client.query.return_value = [
            np.random.rand(expected_dim).tolist(),
            np.random.rand(expected_dim).tolist()
        ]

        features = get_user_features(mock_convex_client, users, num_tags)

        assert features.shape == (2, expected_dim)
        assert isinstance(features, torch.Tensor)

    def test_handles_none_weights(self, mock_convex_client: Mock) -> None:
        """Test that None weights are converted to zero vectors"""
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags

        mock_convex_client.query.return_value = [None]

        features = get_user_features(mock_convex_client, users, num_tags)

        assert features.shape == (1, expected_dim)
        assert torch.all(features == 0)

    def test_pads_short_vectors(self, mock_convex_client: Mock) -> None:
        """Test that short vectors are padded correctly"""
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags
        short_vector = [1.0, 2.0, 3.0]  # Much shorter than expected

        mock_convex_client.query.return_value = [short_vector]

        features = get_user_features(mock_convex_client, users, num_tags)

        assert features.shape == (1, expected_dim)
        assert features[0, 0].item() == 1.0
        assert features[0, 1].item() == 2.0
        assert features[0, 2].item() == 3.0
        assert torch.all(features[0, 3:] == 0)

    def test_truncates_long_vectors(self, mock_convex_client: Mock) -> None:
        """Test that long vectors are truncated correctly"""
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags
        long_vector = list(range(expected_dim + 10))

        mock_convex_client.query.return_value = [long_vector]

        features = get_user_features(mock_convex_client, users, num_tags)

        assert features.shape == (1, expected_dim)
        assert features[0, 0].item() == 0.0
        assert features[0, expected_dim - 1].item() == expected_dim - 1


class TestGetEventFeatures:
    """Tests for get_event_features function"""

    def test_returns_correct_shapes(
        self,
        mock_convex_client: Mock,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        """Test that event features have correct shape"""
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
            if query_name == "data_ml/universal:queryAll":
                return sample_events
            elif query_name == "data_ml/eventRec:getByEventId":
                event_id = params["eventId"]
                return sample_event_tags.get(event_id, [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        event_ids, event_features = get_event_features(mock_convex_client, num_tags, tag_id_to_idx)

        assert len(event_ids) == 2
        assert event_features.shape == (2, num_tags + 4)

    def test_tag_encoding(
        self,
        mock_convex_client: Mock,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        """Test that tags are one-hot encoded correctly"""
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
            if query_name == "data_ml/universal:queryAll":
                return sample_events
            elif query_name == "data_ml/eventRec:getByEventId":
                event_id = params["eventId"]
                return sample_event_tags.get(event_id, [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        event_ids, event_features = get_event_features(mock_convex_client, num_tags, tag_id_to_idx)

        assert event_features[0, 0] == 1.0
        assert event_features[0, 1] == 0.0
        assert event_features[0, 2] == 0.0

        assert event_features[1, 0] == 0.0
        assert event_features[1, 1] == 1.0
        assert event_features[1, 2] == 0.0

    def test_tag_count_normalization(
        self, mock_convex_client: Mock, sample_events: List[Dict[str, Any]]
    ) -> None:
        """Test that tag count is normalized correctly"""
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        event_tags = {
            "event1": [{"tagId": "tag1"}, {"tagId": "tag2"}]
        }

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
            if query_name == "data_ml/universal:queryAll":
                return [sample_events[0]]
            elif query_name == "data_ml/eventRec:getByEventId":
                event_id = params["eventId"]
                return event_tags.get(event_id, [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        event_ids, event_features = get_event_features(mock_convex_client, num_tags, tag_id_to_idx)

        expected_norm = 2.0 / MAX_TAGS
        assert abs(event_features[0, num_tags] - expected_norm) < 1e-6

    def test_temporal_features(
        self,
        mock_convex_client: Mock,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        """Test that day_norm and hour_norm are calculated correctly"""
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
            if query_name == "data_ml/universal:queryAll":
                return [sample_events[0]]
            elif query_name == "data_ml/eventRec:getByEventId":
                return sample_event_tags.get("event1", [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        event_ids, event_features = get_event_features(mock_convex_client, num_tags, tag_id_to_idx)

        expected_day_norm = 5.0 / 6.0
        assert abs(event_features[0, num_tags + 1] - expected_day_norm) < 1e-6

        expected_hour_norm = 19.0 / 23.0
        assert abs(event_features[0, num_tags + 2] - expected_hour_norm) < 1e-6

    def test_is_free_feature(
        self,
        mock_convex_client: Mock,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        """Test that isFree is encoded correctly"""
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
            if query_name == "data_ml/universal:queryAll":
                return sample_events
            elif query_name == "data_ml/eventRec:getByEventId":
                event_id = params["eventId"]
                return sample_event_tags.get(event_id, [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        event_ids, event_features = get_event_features(mock_convex_client, num_tags, tag_id_to_idx)

        assert event_features[0, num_tags + 3] == 0.0

        assert event_features[1, num_tags + 3] == 1.0


class TestMain:
    """Integration tests for main function"""

    @patch('recommendEvent.get_client')
    @patch('recommendEvent.torch.load')
    @patch('recommendEvent.UserTower')
    @patch('recommendEvent.EventTower')
    def test_main_runs_without_error(
            self,
            mock_event_tower: MagicMock,
            mock_user_tower: MagicMock,
            mock_torch_load: MagicMock,
            mock_get_client: MagicMock,
            mock_convex_client: Mock,
            sample_tags: List[Dict[str, Any]],
            sample_users: List[Dict[str, Any]],
            sample_events: List[Dict[str, Any]],
            sample_event_tags: Dict[str, List[Dict[str, Any]]],
            sample_interactions: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        """Test that main runs without errors"""
        # Setup mocks
        mock_get_client.return_value = mock_convex_client

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Any]:
            if query_name == "data_ml/universal:queryAll":
                if params["table_name"] == "tags":
                    return sample_tags
                elif params["table_name"] == "users":
                    return sample_users
                elif params["table_name"] == "events":
                    return sample_events
            elif query_name == "data_ml/eventRec:getUserTagWeights":
                num_tags = len(sample_tags)
                return [np.random.rand(3 * num_tags).tolist() for _ in params["userIDs"]]
            elif query_name == "data_ml/eventRec:getByEventId":
                event_id = params["eventId"]
                return sample_event_tags.get(event_id, [])
            elif query_name == "data_ml/eventRec:getInteractionsByUserId":
                user_id = params["userId"]
                return sample_interactions.get(user_id, [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        mock_user_instance = MagicMock()
        mock_event_instance = MagicMock()

        mock_user_instance.side_effect = lambda x: torch.randn(x.shape[0], 64)
        mock_event_instance.side_effect = lambda x: torch.randn(x.shape[0], 64)

        mock_user_instance.eval.return_value = mock_user_instance
        mock_event_instance.eval.return_value = mock_event_instance
        mock_user_instance.to.return_value = mock_user_instance
        mock_event_instance.to.return_value = mock_event_instance
        mock_user_instance.load_state_dict = MagicMock()
        mock_event_instance.load_state_dict = MagicMock()

        mock_user_tower.return_value = mock_user_instance
        mock_event_tower.return_value = mock_event_instance

        mock_torch_load.return_value = {
            'user_tower': {},
            'event_tower': {}
        }

        try:
            main(["user1", "user2"], update_db=False, model_path="dummy.pt", k=10)
        except Exception as e:
            pytest.fail(f"main() raised {type(e).__name__} unexpectedly: {e}")

    @patch('recommendEvent.get_client')
    @patch('recommendEvent.torch.load')
    @patch('recommendEvent.UserTower')
    @patch('recommendEvent.EventTower')
    def test_main_handles_all_users(
            self,
            mock_event_tower: MagicMock,
            mock_user_tower: MagicMock,
            mock_torch_load: MagicMock,
            mock_get_client: MagicMock,
            mock_convex_client: Mock,
            sample_tags: List[Dict[str, Any]],
            sample_users: List[Dict[str, Any]],
            sample_events: List[Dict[str, Any]],
            sample_event_tags: Dict[str, List[Dict[str, Any]]],
            sample_interactions: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        """Test that main handles 'ALL' users correctly"""
        mock_get_client.return_value = mock_convex_client

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Any]:
            if query_name == "data_ml/universal:queryAll":
                if params["table_name"] == "tags":
                    return sample_tags
                elif params["table_name"] == "users":
                    return sample_users
                elif params["table_name"] == "events":
                    return sample_events
            elif query_name == "data_ml/eventRec:getUserTagWeights":
                num_tags = len(sample_tags)
                return [np.random.rand(3 * num_tags).tolist() for _ in params["userIDs"]]
            elif query_name == "data_ml/eventRec:getByEventId":
                event_id = params["eventId"]
                return sample_event_tags.get(event_id, [])
            elif query_name == "data_ml/eventRec:getInteractionsByUserId":
                user_id = params["userId"]
                return sample_interactions.get(user_id, [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        mock_user_instance = MagicMock()
        mock_event_instance = MagicMock()

        mock_user_instance.side_effect = lambda x: torch.randn(x.shape[0], 64)
        mock_event_instance.side_effect = lambda x: torch.randn(x.shape[0], 64)

        mock_user_instance.eval.return_value = mock_user_instance
        mock_event_instance.eval.return_value = mock_event_instance
        mock_user_instance.to.return_value = mock_user_instance
        mock_event_instance.to.return_value = mock_event_instance
        mock_user_instance.load_state_dict = MagicMock()
        mock_event_instance.load_state_dict = MagicMock()

        mock_user_tower.return_value = mock_user_instance
        mock_event_tower.return_value = mock_event_instance

        mock_torch_load.return_value = {
            'user_tower': {},
            'event_tower': {}
        }

        try:
            main(["ALL"], update_db=False, model_path="dummy.pt", k=10)
        except Exception as e:
            pytest.fail(f"main() with 'ALL' users raised {type(e).__name__} unexpectedly: {e}")

    @patch('recommendEvent.get_client')
    @patch('recommendEvent.torch.load')
    @patch('recommendEvent.UserTower')
    @patch('recommendEvent.EventTower')
    def test_blocked_events_have_negative_score(
            self,
            mock_event_tower: MagicMock,
            mock_user_tower: MagicMock,
            mock_torch_load: MagicMock,
            mock_get_client: MagicMock,
            mock_convex_client: Mock,
            sample_tags: List[Dict[str, Any]],
            sample_users: List[Dict[str, Any]],
            sample_events: List[Dict[str, Any]],
            sample_event_tags: Dict[str, List[Dict[str, Any]]],
            sample_interactions: Dict[str, List[Dict[str, Any]]],
            capsys: pytest.CaptureFixture[str],
    ) -> None:
        """Test that blocked events receive negative scores"""
        mock_get_client.return_value = mock_convex_client

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Any]:
            if query_name == "data_ml/universal:queryAll":
                if params["table_name"] == "tags":
                    return sample_tags
                elif params["table_name"] == "users":
                    return sample_users
                elif params["table_name"] == "events":
                    return sample_events
            elif query_name == "data_ml/eventRec:getUserTagWeights":
                num_tags = len(sample_tags)
                return [np.random.rand(3 * num_tags).tolist() for _ in params["userIDs"]]
            elif query_name == "data_ml/eventRec:getByEventId":
                event_id = params["eventId"]
                return sample_event_tags.get(event_id, [])
            elif query_name == "data_ml/eventRec:getInteractionsByUserId":
                user_id = params["userId"]
                return sample_interactions.get(user_id, [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        mock_user_instance = MagicMock()
        mock_event_instance = MagicMock()

        mock_user_instance.side_effect = lambda x: torch.ones(x.shape[0], 64)
        mock_event_instance.side_effect = lambda x: torch.ones(x.shape[0], 64)

        mock_user_instance.eval.return_value = mock_user_instance
        mock_event_instance.eval.return_value = mock_event_instance
        mock_user_instance.to.return_value = mock_user_instance
        mock_event_instance.to.return_value = mock_event_instance
        mock_user_instance.load_state_dict = MagicMock()
        mock_event_instance.load_state_dict = MagicMock()

        mock_user_tower.return_value = mock_user_instance
        mock_event_tower.return_value = mock_event_instance

        mock_torch_load.return_value = {
            'user_tower': {},
            'event_tower': {}
        }

        main(["user1"], update_db=False, model_path="dummy.pt", k=10)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])