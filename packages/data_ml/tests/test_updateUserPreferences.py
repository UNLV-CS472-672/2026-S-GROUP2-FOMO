import os
import sys
import numpy as np
import pytest
from unittest.mock import patch, MagicMock
from typing import Generator

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "event_rec", "data"))
import updateUserPreferences
from updateUserPreferences import (
    init_tags,
    event_multihot,
    build_matrix,
    build_weights,
    get_interaction_ids,
    build_user_feature_vector,
    main,
)


# ------------------------------
#  FAKE MOCK DATA
# ------------------------------

@pytest.fixture(autouse=True)
def mock_queries() -> Generator[dict[str, MagicMock], None, None]:
    with patch("updateUserPreferences.queries.query_all", return_value=[]) as mock_query_all, \
         patch("updateUserPreferences.queries.get_by_event_id", return_value=[]) as mock_get_by_event, \
         patch("updateUserPreferences.queries.get_by_event_ids", return_value=[]) as mock_get_by_events, \
         patch("updateUserPreferences.queries.get_interactions_by_user_id", return_value=[]) as mock_get_interactions, \
         patch("updateUserPreferences.queries.get_interactions_by_users", return_value=[]) as mock_get_interactions_batch, \
         patch("updateUserPreferences.queries.get_user_tag_weights_with_timestamp", return_value=None) as mock_get_weights_ts, \
         patch("updateUserPreferences.queries.get_user_tag_weights_with_timestamps", return_value=[]) as mock_get_weights_tss, \
         patch("updateUserPreferences.queries.upsert_user_tag_weights") as mock_upsert, \
         patch("updateUserPreferences.queries.upsert_user_tag_weights_batch") as mock_upsert_batch:
        yield {
            "query_all": mock_query_all,
            "get_by_event_id": mock_get_by_event,
            "get_by_event_ids": mock_get_by_events,
            "get_interactions_by_user_id": mock_get_interactions,
            "get_interactions_by_users": mock_get_interactions_batch,
            "get_user_tag_weights_with_timestamp": mock_get_weights_ts,
            "get_user_tag_weights_with_timestamps": mock_get_weights_tss,
            "upsert_user_tag_weights": mock_upsert,
            "upsert_user_tag_weights_batch": mock_upsert_batch,
        }


@pytest.fixture(autouse=True)
def reset_tag_globals() -> Generator[None, None, None]:
    """Ensure module-level tag state is isolated between tests."""
    original_num_tags = updateUserPreferences.NUM_TAGS
    original_map = updateUserPreferences.TAG_ID_TO_IDX
    yield
    updateUserPreferences.NUM_TAGS = original_num_tags
    updateUserPreferences.TAG_ID_TO_IDX = original_map


@pytest.fixture
def tags_initialized() -> None:
    """Set module globals as if init_tags() had run with 3 tags."""
    updateUserPreferences.TAG_ID_TO_IDX = {"t1": 0, "t2": 1, "t3": 2}
    updateUserPreferences.NUM_TAGS = 3


@pytest.fixture
def sample_tags() -> list[dict[str, str]]:
    return [
        {"_id": "t1", "name": "tech"},
        {"_id": "t2", "name": "music"},
        {"_id": "t3", "name": "sports"},
    ]


@pytest.fixture
def sample_event_tags_e1() -> list[dict[str, str]]:
    # e1 has tags: tech, music
    return [
        {"eventId": "e1", "tagId": "t1"},
        {"eventId": "e1", "tagId": "t2"},
    ]


@pytest.fixture
def sample_event_tags_e2() -> list[dict[str, str]]:
    # e2 has tags: sports
    return [
        {"eventId": "e2", "tagId": "t3"},
    ]


# ------------------------------
#  init_tags()
# ------------------------------

def test_init_tags_sets_num_tags(mock_queries: dict[str, MagicMock], sample_tags: list[dict[str, str]]) -> None:
    mock_queries["query_all"].return_value = sample_tags
    init_tags()
    assert updateUserPreferences.NUM_TAGS == 3


def test_init_tags_builds_id_to_idx_map(mock_queries: dict[str, MagicMock], sample_tags: list[dict[str, str]]) -> None:
    mock_queries["query_all"].return_value = sample_tags
    init_tags()
    assert updateUserPreferences.TAG_ID_TO_IDX == {"t1": 0, "t2": 1, "t3": 2}


def test_init_tags_handles_empty(mock_queries: dict[str, MagicMock]) -> None:
    mock_queries["query_all"].return_value = []
    init_tags()
    assert updateUserPreferences.NUM_TAGS == 0
    assert updateUserPreferences.TAG_ID_TO_IDX == {}


# ------------------------------
#  event_multihot()
# ------------------------------

def test_event_multihot_shape(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_queries["get_by_event_id"].return_value = sample_event_tags_e1
    vec = event_multihot("e1")
    assert vec.shape == (3,)


def test_event_multihot_binary(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_queries["get_by_event_id"].return_value = sample_event_tags_e1
    vec = event_multihot("e1")
    assert np.all((vec == 0) | (vec == 1))


def test_event_multihot_correct_indices(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_queries["get_by_event_id"].return_value = sample_event_tags_e1
    vec = event_multihot("e1")
    assert vec[0] == 1.0
    assert vec[1] == 1.0
    assert vec[2] == 0.0


def test_event_multihot_ignores_unknown_tags(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
) -> None:
    mock_queries["get_by_event_id"].return_value = [{"eventId": "e1", "tagId": "t_unknown"}]
    vec = event_multihot("e1")
    assert np.all(vec == 0.0)


# ------------------------------
#  build_matrix()
# ------------------------------

def test_build_matrix_empty(tags_initialized: None) -> None:
    mat = build_matrix([])
    assert mat.shape == (0, 3)


def test_build_matrix_stacks_events(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
    sample_event_tags_e2: list[dict[str, str]],
) -> None:
    mock_queries["get_by_event_ids"].return_value = sample_event_tags_e1 + sample_event_tags_e2
    mat = build_matrix(["e1", "e2"])
    assert mat.shape == (2, 3)
    np.testing.assert_array_equal(
        mat,
        np.array([[1.0, 1.0, 0.0], [0.0, 0.0, 1.0]], dtype=np.float32),
    )


def test_build_matrix_fetches_event_tags_in_batch(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
    sample_event_tags_e2: list[dict[str, str]],
) -> None:
    mock_queries["get_by_event_ids"].return_value = sample_event_tags_e1 + sample_event_tags_e2
    build_matrix(["e1", "e2", "e1"])
    mock_queries["get_by_event_ids"].assert_called_once_with(["e1", "e2"])
    mock_queries["get_by_event_id"].assert_not_called()


# ------------------------------
#  build_weights()
# ------------------------------

def test_build_weights_empty_matrix(tags_initialized: None) -> None:
    empty = np.zeros((0, 3), dtype=np.float32)
    weights = build_weights(empty)
    assert weights.shape == (3,)
    assert np.all(weights == 0.0)


def test_build_weights_shape(tags_initialized: None) -> None:
    mat = np.array([[1.0, 1.0, 0.0], [0.0, 0.0, 1.0]], dtype=np.float32)
    weights = build_weights(mat)
    assert weights.shape == (3,)


def test_build_weights_nonnegative(tags_initialized: None) -> None:
    mat = np.array([[1.0, 1.0, 0.0], [0.0, 0.0, 1.0]], dtype=np.float32)
    weights = build_weights(mat)
    assert np.all(weights >= 0.0)


def test_build_weights_normalization_per_event(tags_initialized: None) -> None:
    """A single 2-tag event should contribute 0.5 to each of its tags."""
    mat = np.array([[1.0, 1.0, 0.0]], dtype=np.float32)
    weights = build_weights(mat, row_weight=1.0)
    np.testing.assert_allclose(weights, [0.5, 0.5, 0.0])


def test_build_weights_higher_attendance_higher_weight(tags_initialized: None) -> None:
    mat = np.array(
        [
            [1.0, 0.0],
            [1.0, 0.0],
            [1.0, 1.0],
        ],
        dtype=np.float32,
    )
    weights = build_weights(mat)
    assert weights[0] > weights[1]


def test_build_weights_row_weight_scales(tags_initialized: None) -> None:
    mat = np.array([[1.0, 0.0, 0.0]], dtype=np.float32)
    low = build_weights(mat, row_weight=0.5)
    high = build_weights(mat, row_weight=2.0)
    assert high[0] > low[0]
    np.testing.assert_allclose(high[0], low[0] * 4.0)


# ------------------------------
#  get_interaction_ids()
# ------------------------------

def test_get_interaction_ids_splits_by_type(mock_queries: dict[str, MagicMock]) -> None:
    mock_queries["get_interactions_by_user_id"].return_value = [
        {"eventId": "e1", "status": "going"},
        {"eventId": "e2", "status": "interested"},
        {"eventId": "e3", "status": "uninterested"},
        {"eventId": "e4", "status": "going"},
    ]
    going, interested, uninterested = get_interaction_ids("u1", -1.0)
    assert going == ["e1", "e4"]
    assert interested == ["e2"]
    assert uninterested == ["e3"]


def test_get_interaction_ids_empty(mock_queries: dict[str, MagicMock]) -> None:
    going, interested, uninterested = get_interaction_ids("u1", -1.0)
    assert going == []
    assert interested == []
    assert uninterested == []


def test_get_interaction_ids_passes_since_when_nonneg(mock_queries: dict[str, MagicMock]) -> None:
    """When user_last_updated >= 0, sinceMs is passed as a positional arg."""
    get_interaction_ids("u1", 1700000000.0)
    call_args = mock_queries["get_interactions_by_user_id"].call_args
    assert call_args.args == ("u1", 1700000000.0)


def test_get_interaction_ids_omits_since_when_negative(mock_queries: dict[str, MagicMock]) -> None:
    """When user_last_updated < 0, only user_id is passed (cold-start path)."""
    get_interaction_ids("u1", -1.0)
    call_args = mock_queries["get_interactions_by_user_id"].call_args
    assert call_args.args == ("u1",)


# ------------------------------
#  build_user_feature_vector()
# ------------------------------

def test_build_user_feature_vector_shape_no_prior_no_events(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
) -> None:
    """No stored row, no interactions -> all-zero (3*NUM_TAGS,) vector."""
    vec = build_user_feature_vector("u1")
    assert vec.shape == (9,)
    assert np.all(vec == 0.0)


def test_build_user_feature_vector_cold_start_pads_to_full_length(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
) -> None:
    """Length-NUM_TAGS cold-start row should land in the going slice; others zero."""
    mock_queries["get_user_tag_weights_with_timestamp"].return_value = {
        "weights": [1.0, 0.0, 1.0],
        "lastUpdatedAt": 1700000000.0,
    }
    vec = build_user_feature_vector("u1")
    going = vec[:3]
    interested = vec[3:6]
    uninterested = vec[6:]
    np.testing.assert_allclose(going, [1.0, 0.0, 1.0])
    assert np.all(interested == 0.0)
    assert np.all(uninterested == 0.0)


def test_build_user_feature_vector_full_length_passthrough(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
) -> None:
    """Length-3*NUM_TAGS stored vector should pass through unchanged when no new events."""
    stored = [0.5, 0.0, 0.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0.2]
    mock_queries["get_user_tag_weights_with_timestamp"].return_value = {
        "weights": stored,
        "lastUpdatedAt": 1700000000.0,
    }
    vec = build_user_feature_vector("u1")
    np.testing.assert_allclose(vec, stored)


def test_build_user_feature_vector_malformed_falls_back_to_zeros(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
) -> None:
    """An array of unexpected length should fall back to zeros."""
    mock_queries["get_user_tag_weights_with_timestamp"].return_value = {
        "weights": [0.1, 0.2],
        "lastUpdatedAt": 1700000000.0,
    }
    vec = build_user_feature_vector("u1")
    assert np.all(vec == 0.0)


def test_build_user_feature_vector_adds_new_event_deltas(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    """A new 'going' event should add normalized contributions to the going slice."""
    mock_queries["get_interactions_by_user_id"].return_value = [{"eventId": "e1", "status": "going"}]
    mock_queries["get_by_event_ids"].return_value = sample_event_tags_e1
    vec = build_user_feature_vector("u1")
    going = vec[:3]
    # e1 has 2 tags (tech, music) -> each gets 0.5 of the row contribution.
    np.testing.assert_allclose(going, [0.5, 0.5, 0.0])
    assert np.all(vec[3:] == 0.0)


def test_build_user_feature_vector_cold_start_plus_new_event(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    """Cold-start prior should add cleanly with new event deltas."""
    mock_queries["get_user_tag_weights_with_timestamp"].return_value = {
        "weights": [1.0, 0.0, 1.0],
        "lastUpdatedAt": 1700000000.0,
    }
    mock_queries["get_interactions_by_user_id"].return_value = [{"eventId": "e1", "status": "going"}]
    mock_queries["get_by_event_ids"].return_value = sample_event_tags_e1
    vec = build_user_feature_vector("u1")
    going = vec[:3]
    # Cold-start [1, 0, 1] + e1 delta [0.5, 0.5, 0] = [1.5, 0.5, 1.0]
    np.testing.assert_allclose(going, [1.5, 0.5, 1.0])


# ------------------------------
#  main()
# ------------------------------

@pytest.fixture
def mock_main_dependencies(
    mock_queries: dict[str, MagicMock],
) -> Generator[dict[str, MagicMock | dict[str, MagicMock]], None, None]:
    with patch("updateUserPreferences.init_tags") as mock_init, \
         patch("updateUserPreferences.get_user_raw_weights_and_last_updated_from_result") as mock_get_state, \
         patch("updateUserPreferences.build_user_feature_vector_from_interactions") as mock_build:

        mock_get_state.return_value = (-1.0, np.zeros(9, dtype=np.float32))
        mock_build.return_value = np.array(
            [0.5, 0.3, 0.2, 0.1, 0.4, 0.0, 0.2, 0.1, 0.0], dtype=np.float32
        )

        yield {
            "init_tags": mock_init,
            "get_user_raw_weights_and_last_updated_from_result": mock_get_state,
            "build_user_feature_vector_from_interactions": mock_build,
            "queries": mock_queries,
        }


def test_main_calls_init_tags(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1"], update_db=False)
    mock_main_dependencies["init_tags"].assert_called_once()


def test_main_calls_build_per_user(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1", "u2"], update_db=False)
    assert mock_main_dependencies["build_user_feature_vector_from_interactions"].call_count == 2


def test_main_expands_all(mock_main_dependencies: dict[str, MagicMock]) -> None:
    mock_main_dependencies["queries"]["query_all"].return_value = [
        {"_id": "u1"},
        {"_id": "u2"},
        {"_id": "u3"},
    ]
    main(["ALL"], update_db=False)
    assert mock_main_dependencies["build_user_feature_vector_from_interactions"].call_count == 3


def test_main_batches_interaction_requests(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].return_value = [
        {"userId": "u1", "weights": [], "lastUpdatedAt": 1700000000.0},
        {"userId": "u2", "weights": [], "lastUpdatedAt": 0},
    ]
    mock_main_dependencies["queries"]["get_interactions_by_users"].return_value = [
        {"userId": "u1", "eventId": "e1", "status": "going"},
        {"userId": "u1", "eventId": "e2", "status": "interested"},
        {"userId": "u2", "eventId": "e1", "status": "uninterested"},
    ]
    mock_main_dependencies["get_user_raw_weights_and_last_updated_from_result"].side_effect = [
        (1700000000.0, np.zeros(9, dtype=np.float32)),
        (-1.0, np.zeros(9, dtype=np.float32)),
    ]

    main(["u1", "u2"], update_db=False)

    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].assert_called_once_with(
        ["u1", "u2"], 0
    )
    mock_main_dependencies["queries"]["get_interactions_by_users"].assert_called_once_with(
        [{"userId": "u1", "sinceMs": 1700000000.0}, {"userId": "u2"}]
    )
    mock_main_dependencies["queries"]["get_by_event_ids"].assert_called_once_with(
        ["e1", "e2"]
    )


def test_main_calls_mutation_when_update_db_true(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=True)
    mock_main_dependencies["queries"]["upsert_user_tag_weights_batch"].assert_called_once()
    mock_main_dependencies["queries"]["upsert_user_tag_weights"].assert_not_called()


def test_main_does_not_call_mutation_when_update_db_false(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=False)
    mock_main_dependencies["queries"]["upsert_user_tag_weights_batch"].assert_not_called()
    mock_main_dependencies["queries"]["upsert_user_tag_weights"].assert_not_called()


def test_main_mutation_payload_correct_keys(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=True)
    rows = mock_main_dependencies["queries"]["upsert_user_tag_weights_batch"].call_args.args[0]
    assert rows[0]["userId"] == "u1"
    assert isinstance(rows[0]["weights"], list)


def test_main_mutation_weights_are_list(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=True)
    rows = mock_main_dependencies["queries"]["upsert_user_tag_weights_batch"].call_args.args[0]
    assert isinstance(rows[0]["weights"], list)
