import os
import sys
import numpy as np
import pytest
from unittest.mock import patch, MagicMock
from typing import Generator

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "event-rec"))
from updateUserPreferences import (
    get_user_event_multihot,
    build_user_tag_weights,
    main,
)



# ------------------------------
#  FAKE MOCK DATA
# ------------------------------

@pytest.fixture(autouse=True)
def mock_client() -> Generator[MagicMock, None, None]:
    with patch("updateUserPreferences.client") as mock:
        yield mock

@pytest.fixture
def sample_tags() -> list[dict[str, str]]:
    return [
        {"_id": "t1", "name": "tech"},
        {"_id": "t2", "name": "music"},
        {"_id": "t3", "name": "sports"},
    ]

@pytest.fixture
def sample_users() -> list[dict[str, str]]:
    return [
        {"_id": "u1", "name": "seed|alice"},
        {"_id": "u2", "name": "seed|bob"},
    ]

@pytest.fixture
def sample_users_to_events() -> list[dict[str, str]]:
    return [
        {"userId": "u1", "eventId": "e1"},
        {"userId": "u1", "eventId": "e2"},
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
def sample_mat_2x3() -> np.ndarray:
    # 2 events, 3 tags
    # event 0: tech + music → [1, 1, 0]
    # event 1: sports       → [0, 0, 1]
    return np.array([
        [1.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
    ], dtype=np.float32)

@pytest.fixture
def sample_user_tag_counts(sample_mat_2x3: np.ndarray) -> dict[str, np.ndarray]:
    return {"u1": sample_mat_2x3}



# ------------------------------
#  get_user_event_multihot()
# ------------------------------

# Should return a dict
def test_get_user_event_multihot_returns_dict(mock_client: MagicMock, sample_tags: list[dict[str, str]], sample_users_to_events: list[dict[str, str]], sample_event_tags_e1: list[dict[str, str]], sample_event_tags_e2: list[dict[str, str]]) -> None:
    mock_client.query.side_effect = [
        sample_tags,
        sample_users_to_events,
        sample_event_tags_e1,
        sample_event_tags_e2,
    ]
    result = get_user_event_multihot(["u1"])
    assert isinstance(result, dict)

# Should have an entry per user passed in
def test_get_user_event_multihot_has_entry_per_user(mock_client: MagicMock, sample_tags: list[dict[str, str]], sample_users_to_events: list[dict[str, str]], sample_event_tags_e1: list[dict[str, str]], sample_event_tags_e2: list[dict[str, str]]) -> None:
    mock_client.query.side_effect = [
        sample_tags,
        sample_users_to_events,
        sample_event_tags_e1,
        sample_event_tags_e2,
    ]
    result = get_user_event_multihot(["u1"])
    assert "u1" in result

# Matrix shape should be (num_events_attended, num_tags)
def test_get_user_event_multihot_correct_shape(mock_client: MagicMock, sample_tags: list[dict[str, str]], sample_users_to_events: list[dict[str, str]], sample_event_tags_e1: list[dict[str, str]], sample_event_tags_e2: list[dict[str, str]]) -> None:
    mock_client.query.side_effect = [
        sample_tags,
        sample_users_to_events,
        sample_event_tags_e1,
        sample_event_tags_e2,
    ]
    result = get_user_event_multihot(["u1"])
    assert result["u1"].shape == (2, 3)  # 2 events, 3 tags

# Matrix values should only be 0 or 1
def test_get_user_event_multihot_binary_values(mock_client: MagicMock, sample_tags: list[dict[str, str]], sample_users_to_events: list[dict[str, str]], sample_event_tags_e1: list[dict[str, str]], sample_event_tags_e2: list[dict[str, str]]) -> None:
    mock_client.query.side_effect = [
        sample_tags,
        sample_users_to_events,
        sample_event_tags_e1,
        sample_event_tags_e2,
    ]
    result = get_user_event_multihot(["u1"])
    mat = result["u1"]
    assert np.all((mat == 0) | (mat == 1))

# User with no events should return a zero matrix with shape (0, num_tags)
def test_get_user_event_multihot_no_events(mock_client: MagicMock, sample_tags: list[dict[str, str]]) -> None:
    mock_client.query.side_effect = [
        sample_tags,
        [],  # no events attended
    ]
    result = get_user_event_multihot(["u1"])
    assert result["u1"].shape == (0, 3)

# Passing "ALL" should resolve all users from the DB
def test_get_user_event_multihot_all_resolves_users(mock_client: MagicMock, sample_tags: list[dict[str, str]], sample_users: list[dict[str, str]]) -> None:
    mock_client.query.side_effect = [
        sample_tags,
        sample_users,   # fetched when "ALL" is passed
        [],             # u1 events
        [],             # u2 events
    ]
    result = get_user_event_multihot(["ALL"])
    assert "u1" in result
    assert "u2" in result



# ------------------------------
#  build_user_tag_weights()
# ------------------------------

# Should return a dict
def test_build_user_tag_weights_returns_dict(sample_user_tag_counts: dict[str, np.ndarray]) -> None:
    result = build_user_tag_weights(sample_user_tag_counts)
    assert isinstance(result, dict)

# Should have an entry per user
def test_build_user_tag_weights_has_entry_per_user(sample_user_tag_counts: dict[str, np.ndarray]) -> None:
    result = build_user_tag_weights(sample_user_tag_counts)
    assert "u1" in result

# Output weights should be 1D vector of length num_tags
def test_build_user_tag_weights_correct_shape(sample_user_tag_counts: dict[str, np.ndarray]) -> None:
    result = build_user_tag_weights(sample_user_tag_counts)
    assert result["u1"].shape == (3,)

# All weights should be bounded between 0 and 1
def test_build_user_tag_weights_bounded(sample_user_tag_counts: dict[str, np.ndarray]) -> None:
    result = build_user_tag_weights(sample_user_tag_counts)
    weights = result["u1"]
    assert np.all(weights >= 0)
    assert np.all(weights < 1)

# User with no events should return all-zero weights
def test_build_user_tag_weights_no_events_returns_baseline() -> None:
    empty_mat = np.zeros((0, 3), dtype=np.float32)
    result = build_user_tag_weights({"u1": empty_mat})
    expected = 0.75 / (0.75 + 1.0)  # beta / (beta + alpha)
    assert np.allclose(result["u1"], expected)

# Should raise ValueError if matrix is not 2D
def test_build_user_tag_weights_raises_on_1d_input() -> None:
    bad_input = {"u1": np.array([1.0, 0.0, 1.0])}
    with pytest.raises(ValueError):
        build_user_tag_weights(bad_input)

# Should raise ValueError if matrix has negative values
def test_build_user_tag_weights_raises_on_negative_values() -> None:
    bad_input = {"u1": np.array([[-1.0, 0.0], [1.0, 0.0]])}
    with pytest.raises(ValueError):
        build_user_tag_weights(bad_input)

# Tags attended more should have higher weights than tags never attended
def test_build_user_tag_weights_higher_attendance_higher_weight() -> None:
    # u1 attends tech tag 3 times, music tag 1 time
    mat = np.array([
        [1.0, 0.0],
        [1.0, 0.0],
        [1.0, 1.0],
    ], dtype=np.float32)
    result = build_user_tag_weights({"u1": mat})
    assert result["u1"][0] > result["u1"][1]



# ------------------------------
#  main()
# ------------------------------

@pytest.fixture
def mock_main_dependencies(mock_client: MagicMock) -> Generator[dict[str, MagicMock], None, None]:
    with patch("updateUserPreferences.get_user_event_multihot") as mock_multihot, \
         patch("updateUserPreferences.build_user_tag_weights")  as mock_build:

        mock_multihot.return_value = {"u1": np.zeros((2, 3), dtype=np.float32)}
        mock_build.return_value    = {"u1": np.array([0.5, 0.3, 0.2], dtype=np.float32)}

        yield {
            "get_user_event_multihot": mock_multihot,
            "build_user_tag_weights":  mock_build,
            "client":                  mock_client,
        }

# When update_db=True, mutation should be called once per user
def test_main_calls_mutation_when_update_db_true(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1"], update_db=True)
    mock_main_dependencies["client"].mutation.assert_called_once()

# When update_db=False, mutation should never be called
def test_main_does_not_call_mutation_when_update_db_false(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1"], update_db=False)
    mock_main_dependencies["client"].mutation.assert_not_called()

# get_user_event_multihot should always be called once
def test_main_calls_get_user_event_multihot(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1"], update_db=False)
    mock_main_dependencies["get_user_event_multihot"].assert_called_once_with(["u1"])

# build_user_tag_weights should always be called once
def test_main_calls_build_user_tag_weights(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1"], update_db=False)
    mock_main_dependencies["build_user_tag_weights"].assert_called_once()

# Mutation payload should contain userId and weights keys
def test_main_mutation_payload_correct_keys(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1"], update_db=True)
    call_kwargs = mock_main_dependencies["client"].mutation.call_args[0][1]
    assert "userId" in call_kwargs
    assert "weights" in call_kwargs

# Weights passed to mutation should be a plain list, not a numpy array
def test_main_mutation_weights_are_list(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main(["u1"], update_db=True)
    call_kwargs = mock_main_dependencies["client"].mutation.call_args[0][1]
    assert isinstance(call_kwargs["weights"], list)