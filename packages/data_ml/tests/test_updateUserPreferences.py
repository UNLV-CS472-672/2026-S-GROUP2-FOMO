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
def mock_client() -> Generator[MagicMock, None, None]:
    """Patch get_client() so no real Convex calls are made."""
    with patch("updateUserPreferences.get_client") as mock_get_client:
        client = MagicMock()
        mock_get_client.return_value = client
        yield client


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

def test_init_tags_sets_num_tags(mock_client: MagicMock, sample_tags: list[dict[str, str]]) -> None:
    mock_client.query.return_value = sample_tags
    init_tags()
    assert updateUserPreferences.NUM_TAGS == 3


def test_init_tags_builds_id_to_idx_map(mock_client: MagicMock, sample_tags: list[dict[str, str]]) -> None:
    mock_client.query.return_value = sample_tags
    init_tags()
    assert updateUserPreferences.TAG_ID_TO_IDX == {"t1": 0, "t2": 1, "t3": 2}


def test_init_tags_handles_empty(mock_client: MagicMock) -> None:
    mock_client.query.return_value = []
    init_tags()
    assert updateUserPreferences.NUM_TAGS == 0
    assert updateUserPreferences.TAG_ID_TO_IDX == {}


# ------------------------------
#  event_multihot()
# ------------------------------

def test_event_multihot_shape(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_client.query.return_value = sample_event_tags_e1
    vec = event_multihot("e1")
    assert vec.shape == (3,)


def test_event_multihot_binary(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_client.query.return_value = sample_event_tags_e1
    vec = event_multihot("e1")
    assert np.all((vec == 0) | (vec == 1))


def test_event_multihot_correct_indices(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_client.query.return_value = sample_event_tags_e1
    vec = event_multihot("e1")
    assert vec[0] == 1.0
    assert vec[1] == 1.0
    assert vec[2] == 0.0


def test_event_multihot_ignores_unknown_tags(
    mock_client: MagicMock,
    tags_initialized: None,
) -> None:
    mock_client.query.return_value = [{"eventId": "e1", "tagId": "t_unknown"}]
    vec = event_multihot("e1")
    assert np.all(vec == 0.0)


# ------------------------------
#  build_matrix()
# ------------------------------

def test_build_matrix_empty(tags_initialized: None) -> None:
    mat = build_matrix([])
    assert mat.shape == (0, 3)


def test_build_matrix_stacks_events(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
    sample_event_tags_e2: list[dict[str, str]],
) -> None:
    mock_client.query.side_effect = [sample_event_tags_e1, sample_event_tags_e2]
    mat = build_matrix(["e1", "e2"])
    assert mat.shape == (2, 3)
    np.testing.assert_array_equal(
        mat,
        np.array([[1.0, 1.0, 0.0], [0.0, 0.0, 1.0]], dtype=np.float32),
    )


# ------------------------------
#  build_weights()
# ------------------------------
# build_weights now returns raw additive sums (no activation).
# Each event contributes a total of row_weight spread across its tags.

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
    """Raw weights are always >= 0 (no negatives, but can exceed 1)."""
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
    # Specifically: high should be exactly 4x low.
    np.testing.assert_allclose(high[0], low[0] * 4.0)


# ------------------------------
#  get_interaction_ids()
# ------------------------------
# Function now takes (user_id, user_last_updated).
# Schema field is `status` with values "going" / "interested" / "uninterested".

# Should split rows by status into three lists
def test_get_interaction_ids_splits_by_type(mock_client: MagicMock) -> None:
    mock_client.query.return_value = [
        {"eventId": "e1", "status": "going"},
        {"eventId": "e2", "status": "interested"},
        {"eventId": "e3", "status": "uninterested"},
        {"eventId": "e4", "status": "going"},
    ]
    going, interested, uninterested = get_interaction_ids("u1", -1.0)
    assert going == ["e1", "e4"]
    assert interested == ["e2"]
    assert uninterested == ["e3"]


def test_get_interaction_ids_empty(mock_client: MagicMock) -> None:
    mock_client.query.return_value = []
    going, interested, uninterested = get_interaction_ids("u1", -1.0)
    assert going == []
    assert interested == []
    assert uninterested == []


def test_get_interaction_ids_passes_since_when_nonneg(mock_client: MagicMock) -> None:
    """When user_last_updated >= 0, sinceMs should be in the query args."""
    mock_client.query.return_value = []
    get_interaction_ids("u1", 1700000000.0)
    args = mock_client.query.call_args[0][1]
    assert args.get("sinceMs") == 1700000000.0


def test_get_interaction_ids_omits_since_when_negative(mock_client: MagicMock) -> None:
    """When user_last_updated < 0, sinceMs should be absent (cold-start path)."""
    mock_client.query.return_value = []
    get_interaction_ids("u1", -1.0)
    args = mock_client.query.call_args[0][1]
    assert "sinceMs" not in args


# ------------------------------
#  build_user_feature_vector()
# ------------------------------
# New flow:
#   1. getUserTagWeightsWithTimestamp -> { weights, lastUpdatedAt } | None
#   2. getInteractionsByUserId -> [interactions]
#   3. getByEventId for each event id (going/interested/uninterested buckets)

def test_build_user_feature_vector_shape_no_prior_no_events(
    mock_client: MagicMock,
    tags_initialized: None,
) -> None:
    """No stored row, no interactions -> all-zero (3*NUM_TAGS,) vector."""
    mock_client.query.side_effect = [
        None,  # getUserTagWeightsWithTimestamp
        [],    # getInteractionsByUserId
    ]
    vec = build_user_feature_vector("u1")
    assert vec.shape == (9,)
    assert np.all(vec == 0.0)


def test_build_user_feature_vector_cold_start_pads_to_full_length(
    mock_client: MagicMock,
    tags_initialized: None,
) -> None:
    """Length-NUM_TAGS cold-start row should land in the going slice; others zero."""
    mock_client.query.side_effect = [
        {"weights": [1.0, 0.0, 1.0], "lastUpdatedAt": 1700000000.0},  # cold-start
        [],  # no new interactions since lastUpdatedAt
    ]
    vec = build_user_feature_vector("u1")
    going = vec[:3]
    interested = vec[3:6]
    uninterested = vec[6:]
    np.testing.assert_allclose(going, [1.0, 0.0, 1.0])
    assert np.all(interested == 0.0)
    assert np.all(uninterested == 0.0)


def test_build_user_feature_vector_full_length_passthrough(
    mock_client: MagicMock,
    tags_initialized: None,
) -> None:
    """Length-3*NUM_TAGS stored vector should pass through unchanged when no new events."""
    stored = [0.5, 0.0, 0.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0.2]
    mock_client.query.side_effect = [
        {"weights": stored, "lastUpdatedAt": 1700000000.0},
        [],
    ]
    vec = build_user_feature_vector("u1")
    np.testing.assert_allclose(vec, stored)


def test_build_user_feature_vector_malformed_falls_back_to_zeros(
    mock_client: MagicMock,
    tags_initialized: None,
) -> None:
    """An array of unexpected length should fall back to zeros."""
    mock_client.query.side_effect = [
        {"weights": [0.1, 0.2], "lastUpdatedAt": 1700000000.0},  # length 2, NUM_TAGS=3
        [],
    ]
    vec = build_user_feature_vector("u1")
    assert np.all(vec == 0.0)


def test_build_user_feature_vector_adds_new_event_deltas(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    """A new 'going' event should add normalized contributions to the going slice."""
    mock_client.query.side_effect = [
        # No prior stored weights — cold-start fallback path.
        None,
        # One new "going" event since lastUpdatedAt=-1 (so all interactions returned).
        [{"eventId": "e1", "status": "going"}],
        # Tags for e1 (looked up by event_multihot).
        sample_event_tags_e1,
    ]
    vec = build_user_feature_vector("u1")
    going = vec[:3]
    # e1 has 2 tags (tech, music) -> each gets 0.5 of the row contribution.
    np.testing.assert_allclose(going, [0.5, 0.5, 0.0])
    # Interested/uninterested unaffected.
    assert np.all(vec[3:] == 0.0)


def test_build_user_feature_vector_cold_start_plus_new_event(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    """Cold-start prior should add cleanly with new event deltas."""
    mock_client.query.side_effect = [
        {"weights": [1.0, 0.0, 1.0], "lastUpdatedAt": 1700000000.0},
        [{"eventId": "e1", "status": "going"}],
        sample_event_tags_e1,
    ]
    vec = build_user_feature_vector("u1")
    going = vec[:3]
    # Cold-start [1, 0, 1] + e1 delta [0.5, 0.5, 0] = [1.5, 0.5, 1.0]
    np.testing.assert_allclose(going, [1.5, 0.5, 1.0])


# ------------------------------
#  main()
# ------------------------------

@pytest.fixture
def mock_main_dependencies(
    mock_client: MagicMock,
) -> Generator[dict[str, MagicMock], None, None]:
    with patch("updateUserPreferences.init_tags") as mock_init, patch(
        "updateUserPreferences.build_user_feature_vector"
    ) as mock_build:

        mock_build.return_value = np.array(
            [0.5, 0.3, 0.2, 0.1, 0.4, 0.0, 0.2, 0.1, 0.0], dtype=np.float32
        )

        yield {
            "init_tags": mock_init,
            "build_user_feature_vector": mock_build,
            "client": mock_client,
        }


def test_main_calls_init_tags(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1"], update_db=False)
    mock_main_dependencies["init_tags"].assert_called_once()


def test_main_calls_build_per_user(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1", "u2"], update_db=False)
    assert mock_main_dependencies["build_user_feature_vector"].call_count == 2


def test_main_expands_all(mock_main_dependencies: dict[str, MagicMock]) -> None:
    mock_main_dependencies["client"].query.return_value = [
        {"_id": "u1"},
        {"_id": "u2"},
        {"_id": "u3"},
    ]
    main(["ALL"], update_db=False)
    assert mock_main_dependencies["build_user_feature_vector"].call_count == 3


def test_main_calls_mutation_when_update_db_true(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=True)
    mock_main_dependencies["client"].mutation.assert_called_once()


def test_main_does_not_call_mutation_when_update_db_false(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=False)
    mock_main_dependencies["client"].mutation.assert_not_called()


def test_main_mutation_payload_correct_keys(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=True)
    payload = mock_main_dependencies["client"].mutation.call_args[0][1]
    assert "userId" in payload
    assert "weights" in payload


def test_main_mutation_weights_are_list(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=True)
    payload = mock_main_dependencies["client"].mutation.call_args[0][1]
    assert isinstance(payload["weights"], list)