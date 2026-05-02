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
    event_multihot_from_rows,
    build_matrix,
    build_matrix_from_rows_by_event_id,
    group_event_tags_by_event_id,
    build_weights,
    get_interaction_ids_from_rows,
    build_user_feature_vector_from_interactions,
    main,
)


# ------------------------------
#  FAKE MOCK DATA
# ------------------------------

@pytest.fixture(autouse=True)
def mock_queries() -> Generator[dict[str, MagicMock], None, None]:
    with patch("updateUserPreferences.queries.query_all", return_value=[]) as mock_query_all, \
         patch("updateUserPreferences.queries.query_active", return_value=[]) as mock_query_active, \
         patch("updateUserPreferences.queries.get_by_event_ids", return_value=[]) as mock_get_by_events, \
         patch("updateUserPreferences.queries.get_interactions_by_user_id", return_value=[]) as mock_get_interactions, \
         patch("updateUserPreferences.queries.get_interactions_by_users", return_value=[]) as mock_get_interactions_batch, \
         patch("updateUserPreferences.queries.get_user_tag_weights_with_timestamps", return_value=[]) as mock_get_weights_tss, \
         patch("updateUserPreferences.queries.upsert_user_tag_weights_batch") as mock_upsert_batch:
        yield {
            "query_all": mock_query_all,
            "query_active": mock_query_active,
            "get_by_event_ids": mock_get_by_events,
            "get_interactions_by_user_id": mock_get_interactions,
            "get_interactions_by_users": mock_get_interactions_batch,
            "get_user_tag_weights_with_timestamps": mock_get_weights_tss,
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


@pytest.fixture
def event_tags_by_id_e1_e2(
    sample_event_tags_e1: list[dict[str, str]],
    sample_event_tags_e2: list[dict[str, str]],
) -> dict[str, list[dict[str, str]]]:
    """Pre-grouped lookup table covering e1 and e2."""
    result: dict[str, list[dict[str, str]]] = group_event_tags_by_event_id(
        sample_event_tags_e1 + sample_event_tags_e2
    )
    return result


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
#  event_multihot_from_rows()
# ------------------------------

def test_event_multihot_shape(
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    vec = event_multihot_from_rows(sample_event_tags_e1)
    assert vec.shape == (3,)


def test_event_multihot_binary(
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    vec = event_multihot_from_rows(sample_event_tags_e1)
    assert np.all((vec == 0) | (vec == 1))


def test_event_multihot_correct_indices(
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    vec = event_multihot_from_rows(sample_event_tags_e1)
    assert vec[0] == 1.0
    assert vec[1] == 1.0
    assert vec[2] == 0.0


def test_event_multihot_ignores_unknown_tags(tags_initialized: None) -> None:
    vec = event_multihot_from_rows([{"eventId": "e1", "tagId": "t_unknown"}])
    assert np.all(vec == 0.0)


def test_event_multihot_empty_rows(tags_initialized: None) -> None:
    vec = event_multihot_from_rows([])
    assert vec.shape == (3,)
    assert np.all(vec == 0.0)


# ------------------------------
#  build_matrix() / build_matrix_from_rows_by_event_id()
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


def test_build_matrix_dedupes_query(
    mock_queries: dict[str, MagicMock],
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
    sample_event_tags_e2: list[dict[str, str]],
) -> None:
    """Duplicate event ids should still result in a single de-duped query."""
    mock_queries["get_by_event_ids"].return_value = sample_event_tags_e1 + sample_event_tags_e2
    build_matrix(["e1", "e2", "e1"])
    mock_queries["get_by_event_ids"].assert_called_once_with(["e1", "e2"])


def test_build_matrix_from_rows_uses_lookup(
    tags_initialized: None,
    event_tags_by_id_e1_e2: dict[str, list[dict[str, str]]],
) -> None:
    """Pre-grouped rows path should produce the same matrix without DB calls."""
    mat = build_matrix_from_rows_by_event_id(["e1", "e2"], event_tags_by_id_e1_e2)
    np.testing.assert_array_equal(
        mat,
        np.array([[1.0, 1.0, 0.0], [0.0, 0.0, 1.0]], dtype=np.float32),
    )


def test_build_matrix_from_rows_unknown_event_zero_row(
    tags_initialized: None,
    event_tags_by_id_e1_e2: dict[str, list[dict[str, str]]],
) -> None:
    """An event id missing from the lookup gets an all-zero row (no contribution)."""
    mat = build_matrix_from_rows_by_event_id(["e_missing"], event_tags_by_id_e1_e2)
    assert mat.shape == (1, 3)
    assert np.all(mat[0] == 0.0)


# ------------------------------
#  build_weights()
# ------------------------------

def test_build_weights_both_empty(tags_initialized: None) -> None:
    empty = np.zeros((0, 3), dtype=np.float32)
    weights = build_weights(empty, empty)
    assert weights.shape == (3,)
    assert np.all(weights == 0.0)


def test_build_weights_update_only_normalization(tags_initialized: None) -> None:
    """A single 2-tag event should contribute 0.5 to each of its tags."""
    mat = np.array([[1.0, 1.0, 0.0]], dtype=np.float32)
    empty = np.zeros((0, 3), dtype=np.float32)
    weights = build_weights(mat, empty, row_weight=1.0)
    np.testing.assert_allclose(weights, [0.5, 0.5, 0.0])


def test_build_weights_discard_subtracts(tags_initialized: None) -> None:
    """Same event in update and discard should net to zero."""
    mat = np.array([[1.0, 1.0, 0.0]], dtype=np.float32)
    weights = build_weights(mat, mat, row_weight=1.0)
    np.testing.assert_allclose(weights, [0.0, 0.0, 0.0])


def test_build_weights_can_be_negative(tags_initialized: None) -> None:
    """Pure discard with no update should produce negative weights."""
    empty = np.zeros((0, 3), dtype=np.float32)
    discard = np.array([[1.0, 1.0, 0.0]], dtype=np.float32)
    weights = build_weights(empty, discard, row_weight=1.0)
    np.testing.assert_allclose(weights, [-0.5, -0.5, 0.0])


def test_build_weights_higher_attendance_higher_weight(tags_initialized: None) -> None:
    update = np.array(
        [
            [1.0, 0.0],
            [1.0, 0.0],
            [1.0, 1.0],
        ],
        dtype=np.float32,
    )
    empty = np.zeros((0, 2), dtype=np.float32)
    # Adjust NUM_TAGS for this 2-tag test
    updateUserPreferences.NUM_TAGS = 2
    weights = build_weights(update, empty)
    assert weights[0] > weights[1]


def test_build_weights_row_weight_scales(tags_initialized: None) -> None:
    mat = np.array([[1.0, 0.0, 0.0]], dtype=np.float32)
    empty = np.zeros((0, 3), dtype=np.float32)
    low = build_weights(mat, empty, row_weight=0.5)
    high = build_weights(mat, empty, row_weight=2.0)
    assert high[0] > low[0]
    np.testing.assert_allclose(high[0], low[0] * 4.0)


# ------------------------------
#  get_interaction_ids_from_rows()
# ------------------------------

def test_get_interaction_ids_splits_current_by_status() -> None:
    rows = [
        {"eventId": "e1", "status": "going"},
        {"eventId": "e2", "status": "interested"},
        {"eventId": "e3", "status": "uninterested"},
        {"eventId": "e4", "status": "going"},
    ]
    (going, interested, uninterested), (pg, pi, pu) = get_interaction_ids_from_rows(rows)
    assert going == ["e1", "e4"]
    assert interested == ["e2"]
    assert uninterested == ["e3"]
    assert pg == [] and pi == [] and pu == []


def test_get_interaction_ids_splits_previous_by_status() -> None:
    """Toggle case: an event can be in different current/previous buckets."""
    rows = [
        {"eventId": "e1", "status": "going", "previousStatus": "interested"},
        {"eventId": "e2", "status": "uninterested", "previousStatus": "going"},
    ]
    (cg, ci, cu), (pg, pi, pu) = get_interaction_ids_from_rows(rows)
    assert cg == ["e1"]
    assert cu == ["e2"]
    assert pi == ["e1"]
    assert pg == ["e2"]
    assert ci == [] and pu == []


def test_get_interaction_ids_handles_missing_status() -> None:
    """Rows without status (e.g., un-RSVP'd) contribute to neither current bucket."""
    rows = [
        {"eventId": "e1", "previousStatus": "going"},  # status removed
    ]
    (cg, ci, cu), (pg, pi, pu) = get_interaction_ids_from_rows(rows)
    assert cg == [] and ci == [] and cu == []
    assert pg == ["e1"]


def test_get_interaction_ids_empty() -> None:
    (cg, ci, cu), (pg, pi, pu) = get_interaction_ids_from_rows([])
    assert cg == [] and ci == [] and cu == []
    assert pg == [] and pi == [] and pu == []


# ------------------------------
#  build_user_feature_vector_from_interactions()
# ------------------------------

def test_build_feature_vector_no_interactions_passes_through_stored(
    tags_initialized: None,
    event_tags_by_id_e1_e2: dict[str, list[dict[str, str]]],
) -> None:
    """No interactions = no delta = stored weights returned unchanged."""
    stored = np.array([0.5, 0.0, 0.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0.2], dtype=np.float32)
    vec = build_user_feature_vector_from_interactions(stored, [], event_tags_by_id_e1_e2)
    assert vec.shape == (9,)
    np.testing.assert_allclose(vec, stored)


def test_build_feature_vector_new_going_event_adds_to_going_slice(
    tags_initialized: None,
    event_tags_by_id_e1_e2: dict[str, list[dict[str, str]]],
) -> None:
    """A new 'going' event with no previousStatus adds to the going slice only."""
    stored = np.zeros(9, dtype=np.float32)
    interactions = [{"eventId": "e1", "status": "going"}]
    vec = build_user_feature_vector_from_interactions(stored, interactions, event_tags_by_id_e1_e2)
    going = vec[:3]
    # e1 has 2 tags, normalized: 0.5 each, row_weight=1.0
    np.testing.assert_allclose(going, [0.5, 0.5, 0.0])
    assert np.all(vec[3:] == 0.0)


def test_build_feature_vector_uninterested_uses_2x_row_weight(
    tags_initialized: None,
    event_tags_by_id_e1_e2: dict[str, list[dict[str, str]]],
) -> None:
    """Uninterested has row_weight=2.0, so e1's contribution is 1.0 per tag."""
    stored = np.zeros(9, dtype=np.float32)
    interactions = [{"eventId": "e1", "status": "uninterested"}]
    vec = build_user_feature_vector_from_interactions(stored, interactions, event_tags_by_id_e1_e2)
    uninterested = vec[6:]
    np.testing.assert_allclose(uninterested, [1.0, 1.0, 0.0])


def test_build_feature_vector_toggle_going_to_uninterested(
    tags_initialized: None,
    event_tags_by_id_e1_e2: dict[str, list[dict[str, str]]],
) -> None:
    """Toggle: subtract from going (-0.5), add to uninterested (+1.0 due to 2x weight)."""
    # Stored: e1 was previously going, contributing 0.5 to going[0] and going[1]
    stored = np.zeros(9, dtype=np.float32)
    stored[0] = 0.5
    stored[1] = 0.5
    interactions = [{"eventId": "e1", "status": "uninterested", "previousStatus": "going"}]
    vec = build_user_feature_vector_from_interactions(stored, interactions, event_tags_by_id_e1_e2)
    # going slice: 0.5 - 0.5 = 0
    np.testing.assert_allclose(vec[:3], [0.0, 0.0, 0.0])
    # interested slice: untouched
    np.testing.assert_allclose(vec[3:6], [0.0, 0.0, 0.0])
    # uninterested slice: + 1.0 each (row_weight 2.0 * 0.5 normalized)
    np.testing.assert_allclose(vec[6:], [1.0, 1.0, 0.0])


def test_build_feature_vector_snaps_small_values_to_zero(
    tags_initialized: None,
    event_tags_by_id_e1_e2: dict[str, list[dict[str, str]]],
) -> None:
    """Float drift below 1e-6 should be snapped to exactly zero."""
    stored = np.zeros(9, dtype=np.float32)
    stored[0] = 1e-8  # below the snap threshold
    vec = build_user_feature_vector_from_interactions(stored, [], event_tags_by_id_e1_e2)
    assert vec[0] == 0.0


# ------------------------------
#  main()
# ------------------------------

@pytest.fixture
def mock_main_dependencies(
    mock_queries: dict[str, MagicMock],
) -> Generator[dict[str, MagicMock | dict[str, MagicMock]], None, None]:
    with patch("updateUserPreferences.init_tags") as mock_init, \
         patch("updateUserPreferences.build_user_feature_vector_from_interactions") as mock_build:

        mock_build.return_value = np.array(
            [0.5, 0.3, 0.2, 0.1, 0.4, 0.0, 0.2, 0.1, 0.0], dtype=np.float32
        )

        # Make NUM_TAGS sane during main() runs since init_tags is mocked out.
        updateUserPreferences.NUM_TAGS = 3
        updateUserPreferences.TAG_ID_TO_IDX = {"t1": 0, "t2": 1, "t3": 2}

        yield {
            "init_tags": mock_init,
            "build_user_feature_vector_from_interactions": mock_build,
            "queries": mock_queries,
        }


def test_main_calls_init_tags(mock_main_dependencies: dict[str, MagicMock]) -> None:
    # User exists in weights table so the loop processes them.
    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].return_value = [
        {"userId": "u1", "weights": [0.0] * 9, "updatedAt": 0.0},
    ]
    main(["u1"], update_db=False)
    mock_main_dependencies["init_tags"].assert_called_once()


def test_main_calls_build_per_user(mock_main_dependencies: dict[str, MagicMock]) -> None:
    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].return_value = [
        {"userId": "u1", "weights": [0.0] * 9, "updatedAt": 0.0},
        {"userId": "u2", "weights": [0.0] * 9, "updatedAt": 0.0},
    ]
    main(["u1", "u2"], update_db=False)
    assert mock_main_dependencies["build_user_feature_vector_from_interactions"].call_count == 2


def test_main_expands_all(mock_main_dependencies: dict[str, MagicMock]) -> None:
    mock_main_dependencies["queries"]["query_all"].return_value = [
        {"_id": "u1"},
        {"_id": "u2"},
        {"_id": "u3"},
    ]
    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].return_value = [
        {"userId": "u1", "weights": [0.0] * 9, "updatedAt": 0.0},
        {"userId": "u2", "weights": [0.0] * 9, "updatedAt": 0.0},
        {"userId": "u3", "weights": [0.0] * 9, "updatedAt": 0.0},
    ]
    main(["ALL"], update_db=False)
    assert mock_main_dependencies["build_user_feature_vector_from_interactions"].call_count == 3


def test_main_expands_active(mock_main_dependencies: dict[str, MagicMock]) -> None:
    """ACTIVE path uses prefetched weights/timestamps from query_active."""
    mock_main_dependencies["queries"]["query_active"].return_value = [
        {"userId": "u1", "updatedAt": 1700000000.0, "weights": [0.0] * 9},
        {"userId": "u2", "updatedAt": 1700000001.0, "weights": [0.1] * 9},
    ]
    main(["ACTIVE"], update_db=False)
    assert mock_main_dependencies["build_user_feature_vector_from_interactions"].call_count == 2


def test_main_active_skips_weights_query(mock_main_dependencies: dict[str, MagicMock]) -> None:
    """ACTIVE already has weights/timestamps, so the bulk-fetch query shouldn't run."""
    mock_main_dependencies["queries"]["query_active"].return_value = [
        {"userId": "u1", "updatedAt": 1700000000.0, "weights": [0.0] * 9},
    ]
    main(["ACTIVE"], update_db=False)
    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].assert_not_called()


def test_main_batches_event_tag_query(mock_main_dependencies: dict[str, MagicMock]) -> None:
    """All event ids across all users go through a single get_by_event_ids call."""
    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].return_value = [
        {"userId": "u1", "weights": [0.0] * 9, "updatedAt": 0.0},
        {"userId": "u2", "weights": [0.0] * 9, "updatedAt": 0.0},
    ]
    mock_main_dependencies["queries"]["get_interactions_by_users"].return_value = [
        {"userId": "u1", "eventId": "e1", "status": "going"},
        {"userId": "u1", "eventId": "e2", "status": "interested"},
        {"userId": "u2", "eventId": "e1", "status": "uninterested"},
    ]

    main(["u1", "u2"], update_db=False)

    # e1 dedupes across users; one batched call with both unique event ids.
    mock_main_dependencies["queries"]["get_by_event_ids"].assert_called_once_with(["e1", "e2"])


def test_main_calls_mutation_when_update_db_true(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].return_value = [
        {"userId": "u1", "weights": [0.0] * 9, "updatedAt": 0.0},
    ]
    main(["u1"], update_db=True)
    mock_main_dependencies["queries"]["upsert_user_tag_weights_batch"].assert_called_once()


def test_main_does_not_call_mutation_when_update_db_false(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].return_value = [
        {"userId": "u1", "weights": [0.0] * 9, "updatedAt": 0.0},
    ]
    main(["u1"], update_db=False)
    mock_main_dependencies["queries"]["upsert_user_tag_weights_batch"].assert_not_called()


def test_main_mutation_payload_correct_keys(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    mock_main_dependencies["queries"]["get_user_tag_weights_with_timestamps"].return_value = [
        {"userId": "u1", "weights": [0.0] * 9, "updatedAt": 0.0},
    ]
    main(["u1"], update_db=True)
    rows = mock_main_dependencies["queries"]["upsert_user_tag_weights_batch"].call_args.args[0]
    assert rows[0]["userId"] == "u1"
    assert isinstance(rows[0]["weights"], list)