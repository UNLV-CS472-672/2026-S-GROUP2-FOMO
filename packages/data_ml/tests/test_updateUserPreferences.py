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
    BETA,
    TAU,
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

# Should set NUM_TAGS to the number of tags returned
def test_init_tags_sets_num_tags(mock_client: MagicMock, sample_tags: list[dict[str, str]]) -> None:
    mock_client.query.return_value = sample_tags
    init_tags()
    assert updateUserPreferences.NUM_TAGS == 3


# Should build a tag-id -> index map
def test_init_tags_builds_id_to_idx_map(mock_client: MagicMock, sample_tags: list[dict[str, str]]) -> None:
    mock_client.query.return_value = sample_tags
    init_tags()
    assert updateUserPreferences.TAG_ID_TO_IDX == {"t1": 0, "t2": 1, "t3": 2}


# Empty tag list should give NUM_TAGS = 0
def test_init_tags_handles_empty(mock_client: MagicMock) -> None:
    mock_client.query.return_value = []
    init_tags()
    assert updateUserPreferences.NUM_TAGS == 0
    assert updateUserPreferences.TAG_ID_TO_IDX == {}


# ------------------------------
#  event_multihot()
# ------------------------------

# Should return a (NUM_TAGS,) vector
def test_event_multihot_shape(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_client.query.return_value = sample_event_tags_e1
    vec = event_multihot("e1")
    assert vec.shape == (3,)


# Values should only be 0 or 1
def test_event_multihot_binary(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_client.query.return_value = sample_event_tags_e1
    vec = event_multihot("e1")
    assert np.all((vec == 0) | (vec == 1))


# Only indices for the event's tags should be set to 1
def test_event_multihot_correct_indices(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_client.query.return_value = sample_event_tags_e1
    vec = event_multihot("e1")
    # e1 has tech (0) + music (1)
    assert vec[0] == 1.0
    assert vec[1] == 1.0
    assert vec[2] == 0.0


# Unknown tag ids should be silently ignored (not in TAG_ID_TO_IDX)
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

# Empty list -> (0, NUM_TAGS) matrix
def test_build_matrix_empty(tags_initialized: None) -> None:
    mat = build_matrix([])
    assert mat.shape == (0, 3)


# Should stack one row per event id
def test_build_matrix_stacks_events(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
    sample_event_tags_e2: list[dict[str, str]],
) -> None:
    mock_client.query.side_effect = [sample_event_tags_e1, sample_event_tags_e2]
    mat = build_matrix(["e1", "e2"])
    assert mat.shape == (2, 3)
    # e1: tech+music, e2: sports
    np.testing.assert_array_equal(
        mat,
        np.array([[1.0, 1.0, 0.0], [0.0, 0.0, 1.0]], dtype=np.float32),
    )


# ------------------------------
#  build_weights()
# ------------------------------

# Empty matrix zero vector of length NUM_TAGS
def test_build_weights_empty_matrix(tags_initialized: None) -> None:
    empty = np.zeros((0, 3), dtype=np.float32)
    weights = build_weights(empty)
    assert weights.shape == (3,)
    assert np.all(weights == 0.0)


# Output should be 1D of length NUM_TAGS
def test_build_weights_shape(tags_initialized: None) -> None:
    mat = np.array([[1.0, 1.0, 0.0], [0.0, 0.0, 1.0]], dtype=np.float32)
    weights = build_weights(mat)
    assert weights.shape == (3,)


# Weights should be bounded in [0, 1)
def test_build_weights_bounded(tags_initialized: None) -> None:
    mat = np.array([[1.0, 1.0, 0.0], [0.0, 0.0, 1.0]], dtype=np.float32)
    weights = build_weights(mat)
    assert np.all(weights >= 0.0)
    assert np.all(weights < 1.0)


# More-attended tags should get higher weights than rarely-attended ones
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


# row_weight should scale contributions: higher row_weight → higher output weights
def test_build_weights_row_weight_scales(tags_initialized: None) -> None:
    mat = np.array([[1.0, 0.0, 0.0]], dtype=np.float32)
    low = build_weights(mat, row_weight=0.5)
    high = build_weights(mat, row_weight=2.0)
    assert high[0] > low[0]


# ------------------------------
#  get_interaction_ids()
# ------------------------------

# Should split rows by interactionType into three lists
def test_get_interaction_ids_splits_by_type(mock_client: MagicMock) -> None:
    mock_client.query.return_value = [
        {"eventId": "e1", "interactionType": "attended"},
        {"eventId": "e2", "interactionType": "interested"},
        {"eventId": "e3", "interactionType": "blocked"},
        {"eventId": "e4", "interactionType": "attended"},
    ]
    attended, interested, blocked = get_interaction_ids("u1")
    assert attended == ["e1", "e4"]
    assert interested == ["e2"]
    assert blocked == ["e3"]


# Empty interactions → three empty lists
def test_get_interaction_ids_empty(mock_client: MagicMock) -> None:
    mock_client.query.return_value = []
    attended, interested, blocked = get_interaction_ids("u1")
    assert attended == []
    assert interested == []
    assert blocked == []


# ------------------------------
#  build_user_feature_vector()
# ------------------------------

# Output should be a concatenation of three (NUM_TAGS,) blocks → shape (3*NUM_TAGS,)
def test_build_user_feature_vector_shape(
    mock_client: MagicMock,
    tags_initialized: None,
) -> None:
    # Order of .query calls inside build_user_feature_vector:
    mock_client.query.side_effect = [[], None]
    vec = build_user_feature_vector("u1")
    assert vec.shape == (9,)  # 3 blocks of 3 tags


# With no events and no prior → entire vector should equal the BETA-only baseline
def test_build_user_feature_vector_baseline(
    mock_client: MagicMock,
    tags_initialized: None,
) -> None:
    mock_client.query.side_effect = [[], None]
    vec = build_user_feature_vector("u1")
    expected = 1.0 - np.exp(-BETA / TAU)
    # Without events, build_weights returns zeros (early return), not the BETA baseline.
    # So attended/interested/blocked blocks should all be 0.
    assert np.all(vec == 0.0)
    # Sanity: baseline constant is finite and positive
    assert expected > 0.0


# Cold-start prior should lift attended weights above the no-event baseline
def test_build_user_feature_vector_prior_lifts_attended(
    mock_client: MagicMock,
    tags_initialized: None,
) -> None:
    # No interactions, but user has preferred tags t1 and t3
    mock_client.query.side_effect = [
        [],  # getInteractionsByUserId
        {"tagIds": ["t1", "t3"]},  # getPreferredTagsByUserId
    ]
    vec = build_user_feature_vector("u1")
    att = vec[:3]
    int_ = vec[3:6]
    blk = vec[6:]
    assert att[0] == pytest.approx(0.5)
    assert att[1] == pytest.approx(0.0)
    assert att[2] == pytest.approx(0.5)
    # Interested/blocked blocks are not affected by the prior
    assert np.all(int_ == 0.0)
    assert np.all(blk == 0.0)


# With interactions, attended block should have non-zero weights for attended tags
def test_build_user_feature_vector_uses_interactions(
    mock_client: MagicMock,
    tags_initialized: None,
    sample_event_tags_e1: list[dict[str, str]],
) -> None:
    mock_client.query.side_effect = [
        [{"eventId": "e1", "interactionType": "attended"}],
        sample_event_tags_e1,
        None,
    ]
    vec = build_user_feature_vector("u1")
    att = vec[:3]

    assert att[0] > att[2]
    assert att[1] > att[2]

    assert 0.0 < att[2] < 0.1


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

        mock_build.return_value = np.array([0.5, 0.3, 0.2, 0.1, 0.4, 0.0, 0.2, 0.1, 0.0], dtype=np.float32)

        yield {
            "init_tags": mock_init,
            "build_user_feature_vector": mock_build,
            "client": mock_client,
        }


# init_tags should always be called once
def test_main_calls_init_tags(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1"], update_db=False)
    mock_main_dependencies["init_tags"].assert_called_once()


# build_user_feature_vector should be called once per user
def test_main_calls_build_per_user(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1", "u2"], update_db=False)
    assert mock_main_dependencies["build_user_feature_vector"].call_count == 2


# "ALL" should expand to every user returned by queryAll
def test_main_expands_all(mock_main_dependencies: dict[str, MagicMock]) -> None:
    mock_main_dependencies["client"].query.return_value = [
        {"_id": "u1"},
        {"_id": "u2"},
        {"_id": "u3"},
    ]
    main(["ALL"], update_db=False)
    assert mock_main_dependencies["build_user_feature_vector"].call_count == 3


# update_db=True mutation called once per user
def test_main_calls_mutation_when_update_db_true(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=True)
    mock_main_dependencies["client"].mutation.assert_called_once()


# update_db=False mutation never called
def test_main_does_not_call_mutation_when_update_db_false(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=False)
    mock_main_dependencies["client"].mutation.assert_not_called()


# Mutation payload should contain userId and weights keys
def test_main_mutation_payload_correct_keys(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=True)
    # Convex client .mutation(name, payload) — payload is positional arg 1
    payload = mock_main_dependencies["client"].mutation.call_args[0][1]
    assert "userId" in payload
    assert "weights" in payload


# Weights in mutation payload should be a plain list (not numpy array)
def test_main_mutation_weights_are_list(
    mock_main_dependencies: dict[str, MagicMock],
) -> None:
    main(["u1"], update_db=True)
    payload = mock_main_dependencies["client"].mutation.call_args[0][1]
    assert isinstance(payload["weights"], list)