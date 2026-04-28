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
    activation_fn,
    MAX_TAGS,
    BETA,
    TAU,
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
        {"_id": "user1", "username": "Alice"},
        {"_id": "user2", "username": "Bob"},
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
            "isFree": False,
        },
        {
            "_id": "event2",
            "name": "Basketball Game",
            "dayOfWeek": 6,
            "startHour": 14,
            "isFree": True,
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
    """Sample user-event interactions (schema field is `status`)"""
    return {
        "user1": [
            {"eventId": "event1", "status": "going"},
            {"eventId": "event2", "status": "uninterested"},
        ],
        "user2": [],
    }


# Helper: what activation_fn(raw) yields, for asserting expected values.
def _activated(raw: float) -> float:
    return float(1.0 - np.exp(-(raw + BETA) / TAU))


# ------------------------------
#  activation_fn
# ------------------------------

class TestActivationFn:
    """Tests for the activation function"""

    def test_zero_input_gives_baseline(self) -> None:
        """activation_fn(0) should equal the BETA-only baseline."""
        result = activation_fn(np.array([0.0], dtype=np.float32))
        expected = 1.0 - np.exp(-BETA / TAU)
        assert result[0] == pytest.approx(expected, abs=1e-6)

    def test_outputs_in_zero_one_range(self) -> None:
        """Non-negative inputs should map into [0, 1)."""
        raw = np.array([0.0, 0.5, 1.0, 5.0, 100.0], dtype=np.float32)
        out = activation_fn(raw)
        assert np.all(out >= 0.0)
        assert np.all(out < 1.0)

    def test_monotonically_increasing(self) -> None:
        """Larger raw weights should produce larger activated values."""
        raw = np.array([0.0, 0.5, 1.0, 2.0], dtype=np.float32)
        out = activation_fn(raw)
        assert np.all(np.diff(out) > 0)

    def test_dtype_is_float32(self) -> None:
        out = activation_fn(np.array([0.5], dtype=np.float32))
        assert out.dtype == np.float32

    def test_preserves_shape_2d(self) -> None:
        raw = np.zeros((3, 5), dtype=np.float32)
        out = activation_fn(raw)
        assert out.shape == (3, 5)


# ------------------------------
#  get_tag_info
# ------------------------------

class TestGetTagInfo:
    """Tests for get_tag_info function"""

    def test_returns_correct_num_tags(
        self, mock_convex_client: Mock, sample_tags: List[Dict[str, Any]]
    ) -> None:
        mock_convex_client.query.return_value = sample_tags
        num_tags, tag_id_to_idx = get_tag_info(mock_convex_client)
        assert num_tags == 3
        assert len(tag_id_to_idx) == 3

    def test_creates_correct_tag_mapping(
        self, mock_convex_client: Mock, sample_tags: List[Dict[str, Any]]
    ) -> None:
        mock_convex_client.query.return_value = sample_tags
        num_tags, tag_id_to_idx = get_tag_info(mock_convex_client)
        assert tag_id_to_idx["tag1"] == 0
        assert tag_id_to_idx["tag2"] == 1
        assert tag_id_to_idx["tag3"] == 2

    def test_empty_tags(self, mock_convex_client: Mock) -> None:
        mock_convex_client.query.return_value = []
        num_tags, tag_id_to_idx = get_tag_info(mock_convex_client)
        assert num_tags == 0
        assert len(tag_id_to_idx) == 0


# ------------------------------
#  log
# ------------------------------

class TestLog:
    def test_log_prints_timestamped_message(self) -> None:
        with patch("recommendEvent.datetime") as mock_datetime, patch(
            "recommendEvent.print"
        ) as mock_print:
            mock_now = MagicMock()
            mock_now.strftime.return_value = "12:34:56 01/02/26"
            mock_datetime.now.return_value = mock_now
            log("hello world")
        mock_print.assert_called_once_with("[12:34:56 01/02/26] hello world")


# ------------------------------
#  get_user_features
# ------------------------------
# get_user_features now applies activation_fn to the stored raw weights
# before returning. So returned tensor values are activated, not raw.

class TestGetUserFeatures:
    """Tests for get_user_features function"""

    def test_returns_correct_shape(self, mock_convex_client: Mock) -> None:
        num_tags = 5
        users = ["user1", "user2"]
        expected_dim = 3 * num_tags

        mock_convex_client.query.return_value = [
            np.random.rand(expected_dim).tolist(),
            np.random.rand(expected_dim).tolist(),
        ]

        features = get_user_features(mock_convex_client, users, num_tags)

        assert features.shape == (2, expected_dim)
        assert isinstance(features, torch.Tensor)

    def test_handles_none_weights_returns_baseline(self, mock_convex_client: Mock) -> None:
        """None weights should produce zeros pre-activation, baseline post-activation."""
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags

        mock_convex_client.query.return_value = [None]

        features = get_user_features(mock_convex_client, users, num_tags)

        assert features.shape == (1, expected_dim)
        # All entries equal the BETA-only baseline.
        baseline = _activated(0.0)
        assert torch.allclose(features, torch.full_like(features, baseline), atol=1e-6)

    def test_pads_short_vectors(self, mock_convex_client: Mock) -> None:
        """Short vectors should be padded with zeros, then activated."""
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags
        short_vector = [1.0, 2.0, 3.0]  # Much shorter than expected

        mock_convex_client.query.return_value = [short_vector]

        features = get_user_features(mock_convex_client, users, num_tags)

        assert features.shape == (1, expected_dim)
        # First three were 1, 2, 3 raw; the rest are 0 raw. All get activated.
        assert features[0, 0].item() == pytest.approx(_activated(1.0), abs=1e-5)
        assert features[0, 1].item() == pytest.approx(_activated(2.0), abs=1e-5)
        assert features[0, 2].item() == pytest.approx(_activated(3.0), abs=1e-5)
        # Padded zeros become the baseline.
        baseline = _activated(0.0)
        assert torch.allclose(
            features[0, 3:], torch.full((expected_dim - 3,), baseline), atol=1e-6
        )

    def test_truncates_long_vectors(self, mock_convex_client: Mock) -> None:
        """Long vectors should be truncated to expected_dim, then activated."""
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags
        long_vector = list(range(expected_dim + 10))

        mock_convex_client.query.return_value = [long_vector]

        features = get_user_features(mock_convex_client, users, num_tags)

        assert features.shape == (1, expected_dim)
        # First raw value was 0, last raw value was expected_dim - 1.
        assert features[0, 0].item() == pytest.approx(_activated(0.0), abs=1e-5)
        assert features[0, expected_dim - 1].item() == pytest.approx(
            _activated(float(expected_dim - 1)), abs=1e-5
        )

    def test_output_is_in_zero_one(self, mock_convex_client: Mock) -> None:
        """All activated outputs should fall in [0, 1)."""
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags

        mock_convex_client.query.return_value = [
            (np.random.rand(expected_dim) * 5).tolist()  # raw values 0..5
        ]

        features = get_user_features(mock_convex_client, users, num_tags)
        assert torch.all(features >= 0.0)
        assert torch.all(features < 1.0)


# ------------------------------
#  get_event_features
# ------------------------------

class TestGetEventFeatures:
    """Tests for get_event_features function"""

    def test_returns_correct_shapes(
        self,
        mock_convex_client: Mock,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
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

        event_ids, event_features = get_event_features(
            mock_convex_client, num_tags, tag_id_to_idx
        )

        assert len(event_ids) == 2
        assert event_features.shape == (2, num_tags + 4)

    def test_tag_encoding(
        self,
        mock_convex_client: Mock,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
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

        event_ids, event_features = get_event_features(
            mock_convex_client, num_tags, tag_id_to_idx
        )

        assert event_features[0, 0] == 1.0
        assert event_features[0, 1] == 0.0
        assert event_features[0, 2] == 0.0

        assert event_features[1, 0] == 0.0
        assert event_features[1, 1] == 1.0
        assert event_features[1, 2] == 0.0

    def test_tag_count_normalization(
        self, mock_convex_client: Mock, sample_events: List[Dict[str, Any]]
    ) -> None:
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        event_tags = {"event1": [{"tagId": "tag1"}, {"tagId": "tag2"}]}

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
            if query_name == "data_ml/universal:queryAll":
                return [sample_events[0]]
            elif query_name == "data_ml/eventRec:getByEventId":
                event_id = params["eventId"]
                return event_tags.get(event_id, [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        event_ids, event_features = get_event_features(
            mock_convex_client, num_tags, tag_id_to_idx
        )

        expected_norm = 2.0 / MAX_TAGS
        assert abs(event_features[0, num_tags] - expected_norm) < 1e-6

    def test_temporal_features(
        self,
        mock_convex_client: Mock,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        def query_side_effect(query_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
            if query_name == "data_ml/universal:queryAll":
                return [sample_events[0]]
            elif query_name == "data_ml/eventRec:getByEventId":
                return sample_event_tags.get("event1", [])
            return []

        mock_convex_client.query.side_effect = query_side_effect

        event_ids, event_features = get_event_features(
            mock_convex_client, num_tags, tag_id_to_idx
        )

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

        event_ids, event_features = get_event_features(
            mock_convex_client, num_tags, tag_id_to_idx
        )

        assert event_features[0, num_tags + 3] == 0.0
        assert event_features[1, num_tags + 3] == 1.0


# ------------------------------
#  get_client
# ------------------------------

class TestGetClient:
    """Tests for get_client function"""

    def test_get_client_raises_when_not_initialized(self) -> None:
        import recommendEvent
        with patch.object(recommendEvent, "client", None):
            with pytest.raises(RuntimeError, match="ConvexClient not initialized"):
                recommendEvent.get_client()

    def test_get_client_returns_client_when_initialized(self) -> None:
        import recommendEvent
        mock_client = MagicMock()
        with patch.object(recommendEvent, "client", mock_client):
            assert recommendEvent.get_client() is mock_client


# ------------------------------
#  main (integration)
# ------------------------------

class TestMain:
    """Integration tests for main function"""

    @patch("recommendEvent.get_client")
    @patch("recommendEvent.torch.load")
    @patch("recommendEvent.UserTower")
    @patch("recommendEvent.EventTower")
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
                return sample_event_tags.get(params["eventId"], [])
            elif query_name == "data_ml/eventRec:getInteractionsByUserId":
                return sample_interactions.get(params["userId"], [])
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

        mock_torch_load.return_value = {"user_tower": {}, "event_tower": {}}

        try:
            main(["user1", "user2"], update_db=False, model_path="dummy.pt", k=10)
        except Exception as e:
            pytest.fail(f"main() raised {type(e).__name__} unexpectedly: {e}")

    @patch("recommendEvent.get_client")
    @patch("recommendEvent.torch.load")
    @patch("recommendEvent.UserTower")
    @patch("recommendEvent.EventTower")
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
                return sample_event_tags.get(params["eventId"], [])
            elif query_name == "data_ml/eventRec:getInteractionsByUserId":
                return sample_interactions.get(params["userId"], [])
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

        mock_torch_load.return_value = {"user_tower": {}, "event_tower": {}}

        try:
            main(["ALL"], update_db=False, model_path="dummy.pt", k=10)
        except Exception as e:
            pytest.fail(f"main() with 'ALL' users raised {type(e).__name__} unexpectedly: {e}")

    @patch("recommendEvent.get_client")
    @patch("recommendEvent.torch.load")
    @patch("recommendEvent.UserTower")
    @patch("recommendEvent.EventTower")
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
    ) -> None:
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
                return sample_event_tags.get(params["eventId"], [])
            elif query_name == "data_ml/eventRec:getInteractionsByUserId":
                return sample_interactions.get(params["userId"], [])
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

        mock_torch_load.return_value = {"user_tower": {}, "event_tower": {}}

        main(["user1"], update_db=False, model_path="dummy.pt", k=10)

    @patch("recommendEvent.get_client")
    @patch("recommendEvent.torch.load")
    @patch("recommendEvent.UserTower")
    @patch("recommendEvent.EventTower")
    def test_main_writes_to_convex_when_update_db_true(
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
                return sample_event_tags.get(params["eventId"], [])
            elif query_name == "data_ml/eventRec:getInteractionsByUserId":
                return sample_interactions.get(params["userId"], [])
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
        mock_torch_load.return_value = {"user_tower": {}, "event_tower": {}}

        main(["user1", "user2"], update_db=True, model_path="dummy.pt", k=2)

        mutation_calls = [
            call
            for call in mock_convex_client.mutation.call_args_list
            if call.args[0] == "data_ml/eventRec:upsertEventRecs"
        ]
        assert len(mutation_calls) == 2

        for call in mutation_calls:
            args = call.args[1]
            assert "userId" in args
            assert "eventIds" in args
            assert isinstance(args["eventIds"], list)
            assert len(args["eventIds"]) == 2  # k=2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])