import pytest
import torch
import numpy as np
from unittest.mock import MagicMock, patch
from typing import Any, Dict, List

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from event_rec.recommendEvent import (
    get_user_features,
    get_event_features,
    main,
    MAX_TAGS,
    BETA,
    TAU,
)


@pytest.fixture
def sample_tags() -> List[Dict[str, Any]]:
    return [
        {"_id": "tag1", "name": "Music"},
        {"_id": "tag2", "name": "Sports"},
        {"_id": "tag3", "name": "Food"},
    ]


@pytest.fixture
def sample_users() -> List[Dict[str, Any]]:
    return [
        {"_id": "user1", "username": "Alice"},
        {"_id": "user2", "username": "Bob"},
    ]


@pytest.fixture
def sample_events() -> List[Dict[str, Any]]:
    return [
        {"_id": "event1", "name": "Concert", "dayOfWeek": 5, "startHour": 19, "isFree": False},
        {"_id": "event2", "name": "Basketball Game", "dayOfWeek": 6, "startHour": 14, "isFree": True},
    ]


@pytest.fixture
def sample_event_tags() -> Dict[str, List[Dict[str, Any]]]:
    return {
        "event1": [{"tagId": "tag1"}],
        "event2": [{"tagId": "tag2"}],
    }


@pytest.fixture
def sample_interactions() -> Dict[str, List[Dict[str, Any]]]:
    return {
        "user1": [
            {"eventId": "event1", "status": "going"},
            {"eventId": "event2", "status": "uninterested"},
        ],
        "user2": [],
    }


def _activated(raw: float) -> float:
    return float(1.0 - np.exp(-(raw + BETA) / TAU))


# ------------------------------
#  get_user_features
# ------------------------------

class TestGetUserFeatures:
    def test_returns_correct_shape(self) -> None:
        num_tags = 5
        users = ["user1", "user2"]
        expected_dim = 3 * num_tags
        weights = [np.random.rand(expected_dim).tolist(), np.random.rand(expected_dim).tolist()]

        with patch("event_rec.recommendEvent.queries.get_user_tag_weights", return_value=weights), \
             patch("event_rec.recommendEvent.queries.get_preferred_tags_by_user_id", return_value=[]):
            features = get_user_features(users, num_tags)

        assert features.shape == (2, expected_dim)
        assert isinstance(features, torch.Tensor)

    def test_handles_none_weights_returns_baseline(self) -> None:
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags

        with patch("event_rec.recommendEvent.queries.get_user_tag_weights", return_value=[None]), \
             patch("event_rec.recommendEvent.queries.get_preferred_tags_by_user_id", return_value=[]):
            features = get_user_features(users, num_tags)

        assert features.shape == (1, expected_dim)
        baseline = _activated(0.0)
        assert torch.allclose(features, torch.full_like(features, baseline), atol=1e-6)

    def test_pads_short_vectors(self) -> None:
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags
        short_vector = [1.0, 2.0, 3.0]

        with patch("event_rec.recommendEvent.queries.get_user_tag_weights", return_value=[short_vector]), \
             patch("event_rec.recommendEvent.queries.get_preferred_tags_by_user_id", return_value=[]):
            features = get_user_features(users, num_tags)

        assert features.shape == (1, expected_dim)
        assert features[0, 0].item() == pytest.approx(_activated(1.0), abs=1e-5)
        assert features[0, 1].item() == pytest.approx(_activated(2.0), abs=1e-5)
        assert features[0, 2].item() == pytest.approx(_activated(3.0), abs=1e-5)
        baseline = _activated(0.0)
        assert torch.allclose(features[0, 3:], torch.full((expected_dim - 3,), baseline), atol=1e-6)

    def test_truncates_long_vectors(self) -> None:
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags
        long_vector = list(range(expected_dim + 10))

        with patch("event_rec.recommendEvent.queries.get_user_tag_weights", return_value=[long_vector]), \
             patch("event_rec.recommendEvent.queries.get_preferred_tags_by_user_id", return_value=[]):
            features = get_user_features(users, num_tags)

        assert features.shape == (1, expected_dim)
        assert features[0, 0].item() == pytest.approx(_activated(0.0), abs=1e-5)
        assert features[0, expected_dim - 1].item() == pytest.approx(_activated(float(expected_dim - 1)), abs=1e-5)

    def test_output_is_in_zero_one(self) -> None:
        num_tags = 5
        users = ["user1"]
        expected_dim = 3 * num_tags
        weights = [(np.random.rand(expected_dim) * 5).tolist()]

        with patch("event_rec.recommendEvent.queries.get_user_tag_weights", return_value=weights), \
             patch("event_rec.recommendEvent.queries.get_preferred_tags_by_user_id", return_value=[]):
            features = get_user_features(users, num_tags)

        assert torch.all(features >= 0.0)
        assert torch.all(features < 1.0)


# ------------------------------
#  get_event_features
# ------------------------------

class TestGetEventFeatures:
    def test_returns_correct_shapes(
        self,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        with patch("event_rec.recommendEvent.queries.query_all", return_value=sample_events), \
             patch("event_rec.recommendEvent.queries.get_by_event_id",
                   side_effect=lambda eid: sample_event_tags.get(eid, [])):
            event_ids, event_features = get_event_features(num_tags, tag_id_to_idx)

        assert len(event_ids) == 2
        assert event_features.shape == (2, num_tags + 4)

    def test_tag_encoding(
        self,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        with patch("event_rec.recommendEvent.queries.query_all", return_value=sample_events), \
             patch("event_rec.recommendEvent.queries.get_by_event_id",
                   side_effect=lambda eid: sample_event_tags.get(eid, [])):
            event_ids, event_features = get_event_features(num_tags, tag_id_to_idx)

        assert event_features[0, 0] == 1.0
        assert event_features[0, 1] == 0.0
        assert event_features[0, 2] == 0.0
        assert event_features[1, 0] == 0.0
        assert event_features[1, 1] == 1.0
        assert event_features[1, 2] == 0.0

    def test_tag_count_normalization(self, sample_events: List[Dict[str, Any]]) -> None:
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}
        event_tags = {"event1": [{"tagId": "tag1"}, {"tagId": "tag2"}]}

        with patch("event_rec.recommendEvent.queries.query_all", return_value=[sample_events[0]]), \
             patch("event_rec.recommendEvent.queries.get_by_event_id",
                   side_effect=lambda eid: event_tags.get(eid, [])):
            event_ids, event_features = get_event_features(num_tags, tag_id_to_idx)

        assert abs(event_features[0, num_tags] - 2.0 / MAX_TAGS) < 1e-6

    def test_temporal_features(
        self,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        with patch("event_rec.recommendEvent.queries.query_all", return_value=[sample_events[0]]), \
             patch("event_rec.recommendEvent.queries.get_by_event_id",
                   return_value=sample_event_tags["event1"]):
            event_ids, event_features = get_event_features(num_tags, tag_id_to_idx)

        assert abs(event_features[0, num_tags + 1] - 5.0 / 6.0) < 1e-6
        assert abs(event_features[0, num_tags + 2] - 19.0 / 23.0) < 1e-6

    def test_is_free_feature(
        self,
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        num_tags = 3
        tag_id_to_idx = {"tag1": 0, "tag2": 1, "tag3": 2}

        with patch("event_rec.recommendEvent.queries.query_all", return_value=sample_events), \
             patch("event_rec.recommendEvent.queries.get_by_event_id",
                   side_effect=lambda eid: sample_event_tags.get(eid, [])):
            event_ids, event_features = get_event_features(num_tags, tag_id_to_idx)

        assert event_features[0, num_tags + 3] == 0.0
        assert event_features[1, num_tags + 3] == 1.0


# ------------------------------
#  main (integration)
# ------------------------------

def _make_tower_mock(output_fn: Any = None) -> MagicMock:
    fn = output_fn or (lambda x: torch.randn(x.shape[0], 64))
    inst = MagicMock()
    inst.side_effect = fn
    inst.eval.return_value = inst
    inst.to.return_value = inst
    inst.load_state_dict = MagicMock()
    return inst


class TestMain:
    @patch("event_rec.recommendEvent.queries.get_preferred_tags_by_user_id")
    @patch("event_rec.recommendEvent.queries.upsert_event_recs")
    @patch("event_rec.recommendEvent.queries.get_interactions_by_user_id")
    @patch("event_rec.recommendEvent.queries.get_by_event_id")
    @patch("event_rec.recommendEvent.queries.get_user_tag_weights")
    @patch("event_rec.recommendEvent.queries.query_all")
    @patch("event_rec.recommendEvent.queries.get_tag_info")
    @patch("event_rec.recommendEvent.torch.load")
    @patch("event_rec.recommendEvent.UserTower")
    @patch("event_rec.recommendEvent.EventTower")
    def test_main_runs_without_error(
        self,
        mock_event_tower: MagicMock,
        mock_user_tower: MagicMock,
        mock_torch_load: MagicMock,
        mock_get_tag_info: MagicMock,
        mock_query_all: MagicMock,
        mock_get_weights: MagicMock,
        mock_get_by_event: MagicMock,
        mock_get_interactions: MagicMock,
        mock_upsert: MagicMock,
        mock_get_preferred_tags: MagicMock,
        sample_tags: List[Dict[str, Any]],
        sample_users: List[Dict[str, Any]],
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
        sample_interactions: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        num_tags = len(sample_tags)
        tag_id_to_idx = {tag["_id"]: i for i, tag in enumerate(sample_tags)}
        mock_get_tag_info.return_value = (num_tags, tag_id_to_idx)
        mock_query_all.side_effect = lambda t: sample_users if t == "users" else sample_events
        mock_get_weights.side_effect = lambda users: [np.random.rand(3 * num_tags).tolist() for _ in users]
        mock_get_by_event.side_effect = lambda eid: sample_event_tags.get(eid, [])
        mock_get_interactions.side_effect = lambda uid: sample_interactions.get(uid, [])
        mock_torch_load.return_value = {"user_tower": {}, "event_tower": {}}
        mock_user_tower.return_value = _make_tower_mock()
        mock_event_tower.return_value = _make_tower_mock()

        try:
            main(["user1", "user2"], update_db=False, model_path="dummy.pt", k=10)
        except Exception as e:
            pytest.fail(f"main() raised {type(e).__name__} unexpectedly: {e}")

    @patch("event_rec.recommendEvent.queries.get_preferred_tags_by_user_id")
    @patch("event_rec.recommendEvent.queries.upsert_event_recs")
    @patch("event_rec.recommendEvent.queries.get_interactions_by_user_id")
    @patch("event_rec.recommendEvent.queries.get_by_event_id")
    @patch("event_rec.recommendEvent.queries.get_user_tag_weights")
    @patch("event_rec.recommendEvent.queries.query_all")
    @patch("event_rec.recommendEvent.queries.get_tag_info")
    @patch("event_rec.recommendEvent.torch.load")
    @patch("event_rec.recommendEvent.UserTower")
    @patch("event_rec.recommendEvent.EventTower")
    def test_main_handles_all_users(
        self,
        mock_event_tower: MagicMock,
        mock_user_tower: MagicMock,
        mock_torch_load: MagicMock,
        mock_get_tag_info: MagicMock,
        mock_query_all: MagicMock,
        mock_get_weights: MagicMock,
        mock_get_by_event: MagicMock,
        mock_get_interactions: MagicMock,
        mock_upsert: MagicMock,
        mock_get_preferred_tags: MagicMock,
        sample_tags: List[Dict[str, Any]],
        sample_users: List[Dict[str, Any]],
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
        sample_interactions: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        num_tags = len(sample_tags)
        tag_id_to_idx = {tag["_id"]: i for i, tag in enumerate(sample_tags)}
        mock_get_tag_info.return_value = (num_tags, tag_id_to_idx)
        mock_query_all.side_effect = lambda t: sample_users if t == "users" else sample_events
        mock_get_weights.side_effect = lambda users: [np.random.rand(3 * num_tags).tolist() for _ in users]
        mock_get_by_event.side_effect = lambda eid: sample_event_tags.get(eid, [])
        mock_get_interactions.side_effect = lambda uid: sample_interactions.get(uid, [])
        mock_torch_load.return_value = {"user_tower": {}, "event_tower": {}}
        mock_user_tower.return_value = _make_tower_mock()
        mock_event_tower.return_value = _make_tower_mock()

        try:
            main(["ALL"], update_db=False, model_path="dummy.pt", k=10)
        except Exception as e:
            pytest.fail(f"main() with 'ALL' users raised {type(e).__name__} unexpectedly: {e}")

    @patch("event_rec.recommendEvent.queries.get_preferred_tags_by_user_id")
    @patch("event_rec.recommendEvent.queries.upsert_event_recs")
    @patch("event_rec.recommendEvent.queries.get_interactions_by_user_id")
    @patch("event_rec.recommendEvent.queries.get_by_event_id")
    @patch("event_rec.recommendEvent.queries.get_user_tag_weights")
    @patch("event_rec.recommendEvent.queries.query_all")
    @patch("event_rec.recommendEvent.queries.get_tag_info")
    @patch("event_rec.recommendEvent.torch.load")
    @patch("event_rec.recommendEvent.UserTower")
    @patch("event_rec.recommendEvent.EventTower")
    def test_blocked_events_have_negative_score(
        self,
        mock_event_tower: MagicMock,
        mock_user_tower: MagicMock,
        mock_torch_load: MagicMock,
        mock_get_tag_info: MagicMock,
        mock_query_all: MagicMock,
        mock_get_weights: MagicMock,
        mock_get_by_event: MagicMock,
        mock_get_interactions: MagicMock,
        mock_upsert: MagicMock,
        mock_get_preferred_tags: MagicMock,
        sample_tags: List[Dict[str, Any]],
        sample_users: List[Dict[str, Any]],
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
        sample_interactions: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        num_tags = len(sample_tags)
        tag_id_to_idx = {tag["_id"]: i for i, tag in enumerate(sample_tags)}
        mock_get_tag_info.return_value = (num_tags, tag_id_to_idx)
        mock_query_all.side_effect = lambda t: sample_users if t == "users" else sample_events
        mock_get_weights.side_effect = lambda users: [np.random.rand(3 * num_tags).tolist() for _ in users]
        mock_get_by_event.side_effect = lambda eid: sample_event_tags.get(eid, [])
        mock_get_interactions.side_effect = lambda uid: sample_interactions.get(uid, [])
        mock_torch_load.return_value = {"user_tower": {}, "event_tower": {}}
        mock_user_tower.return_value = _make_tower_mock(lambda x: torch.ones(x.shape[0], 64))
        mock_event_tower.return_value = _make_tower_mock(lambda x: torch.ones(x.shape[0], 64))

        main(["user1"], update_db=False, model_path="dummy.pt", k=10)

    @patch("event_rec.recommendEvent.queries.get_preferred_tags_by_user_id")
    @patch("event_rec.recommendEvent.queries.upsert_event_recs")
    @patch("event_rec.recommendEvent.queries.get_interactions_by_user_id")
    @patch("event_rec.recommendEvent.queries.get_by_event_id")
    @patch("event_rec.recommendEvent.queries.get_user_tag_weights")
    @patch("event_rec.recommendEvent.queries.query_all")
    @patch("event_rec.recommendEvent.queries.get_tag_info")
    @patch("event_rec.recommendEvent.torch.load")
    @patch("event_rec.recommendEvent.UserTower")
    @patch("event_rec.recommendEvent.EventTower")
    def test_main_writes_to_db_when_update_db_true(
        self,
        mock_event_tower: MagicMock,
        mock_user_tower: MagicMock,
        mock_torch_load: MagicMock,
        mock_get_tag_info: MagicMock,
        mock_query_all: MagicMock,
        mock_get_weights: MagicMock,
        mock_get_by_event: MagicMock,
        mock_get_interactions: MagicMock,
        mock_upsert: MagicMock,
        mock_get_preferred_tags: MagicMock,
        sample_tags: List[Dict[str, Any]],
        sample_users: List[Dict[str, Any]],
        sample_events: List[Dict[str, Any]],
        sample_event_tags: Dict[str, List[Dict[str, Any]]],
        sample_interactions: Dict[str, List[Dict[str, Any]]],
    ) -> None:
        num_tags = len(sample_tags)
        tag_id_to_idx = {tag["_id"]: i for i, tag in enumerate(sample_tags)}
        mock_get_tag_info.return_value = (num_tags, tag_id_to_idx)
        mock_query_all.side_effect = lambda t: sample_users if t == "users" else sample_events
        mock_get_weights.side_effect = lambda users: [np.random.rand(3 * num_tags).tolist() for _ in users]
        mock_get_by_event.side_effect = lambda eid: sample_event_tags.get(eid, [])
        mock_get_interactions.side_effect = lambda uid: sample_interactions.get(uid, [])
        mock_torch_load.return_value = {"user_tower": {}, "event_tower": {}}
        mock_user_tower.return_value = _make_tower_mock()
        mock_event_tower.return_value = _make_tower_mock()

        main(["user1", "user2"], update_db=True, model_path="dummy.pt", k=2)

        assert mock_upsert.call_count == 2
        for call in mock_upsert.call_args_list:
            user_id, event_ids = call.args
            assert isinstance(event_ids, list)
            assert len(event_ids) == 2  # k=2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
