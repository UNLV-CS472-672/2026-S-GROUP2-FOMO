import os
import sys
import numpy as np
import pytest
from unittest.mock import patch, MagicMock, mock_open
import random

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "event-rec"))


from data.generate_training_data import (
    TAG_IDX,
    TAGS,
    NUM_TAGS,
    MAX_TAGS,
    EVENT_ARCHETYPES,
    USER_PERSONAS,
    generate_event,
    generate_event_for_user,
    simulate_user,
    generate_users,
    generate_events,
    cosine_sim_attended,
    mine_triplets,
    main,
)

MODULE_PATH = 'data.generate_training_data'


# ------------------------------
#  CONSTANTS TESTS
# ------------------------------

def test_tag_idx_has_27_tags() -> None:
    """Test TAG_IDX has exactly 27 tags"""
    assert len(TAG_IDX) == 27


def test_num_tags_equals_tag_idx_length() -> None:
    """Test NUM_TAGS constant matches TAG_IDX length"""
    assert NUM_TAGS == len(TAG_IDX)


def test_tags_sorted_by_index() -> None:
    """Test TAGS list is sorted by TAG_IDX values"""
    for i, tag in enumerate(TAGS):
        assert TAG_IDX[tag] == i


def test_max_tags_is_8() -> None:
    """Test MAX_TAGS is set to 8 for normalization"""
    assert MAX_TAGS == 8


def test_event_archetypes_is_not_empty() -> None:
    """Test EVENT_ARCHETYPES has entries"""
    assert len(EVENT_ARCHETYPES) > 0


def test_user_personas_is_not_empty() -> None:
    """Test USER_PERSONAS has entries"""
    assert len(USER_PERSONAS) > 0


# ------------------------------
#  generate_event
# ------------------------------

def test_generate_event_returns_correct_shape() -> None:
    """Test generate_event returns (NUM_TAGS + 4,) array"""
    archetype = EVENT_ARCHETYPES[0]
    event = generate_event(archetype)

    assert event.shape == (NUM_TAGS + 4,)


def test_generate_event_returns_float32() -> None:
    """Test generate_event returns float32 dtype"""
    archetype = EVENT_ARCHETYPES[0]
    event = generate_event(archetype)

    assert event.dtype == np.float32


def test_generate_event_includes_required_tags() -> None:
    """Test generate_event includes all required tags"""
    # Use rap_concert archetype which has ["concert", "rap", "music"]
    archetype = EVENT_ARCHETYPES[0]
    event = generate_event(archetype)

    required_tags = archetype[1]
    for tag in required_tags:
        tag_idx = TAG_IDX[tag]
        assert event[tag_idx] == 1.0


def test_generate_event_tag_count_norm_in_range() -> None:
    """Test tag_count_norm is between 0 and 1"""
    archetype = EVENT_ARCHETYPES[0]
    event = generate_event(archetype)

    tag_count_norm = event[NUM_TAGS]
    assert 0.0 <= tag_count_norm <= 1.0


def test_generate_event_day_norm_in_range() -> None:
    """Test day_norm is between 0 and 1"""
    archetype = EVENT_ARCHETYPES[0]
    event = generate_event(archetype)

    day_norm = event[NUM_TAGS + 1]
    assert 0.0 <= day_norm <= 1.0


def test_generate_event_hour_norm_in_range() -> None:
    """Test hour_norm is between 0 and 1"""
    archetype = EVENT_ARCHETYPES[0]
    event = generate_event(archetype)

    hour_norm = event[NUM_TAGS + 2]
    assert 0.0 <= hour_norm <= 1.0


def test_generate_event_is_free_is_binary() -> None:
    """Test is_free is either 0.0 or 1.0"""
    archetype = EVENT_ARCHETYPES[0]
    event = generate_event(archetype)

    is_free = event[NUM_TAGS + 3]
    assert is_free in [0.0, 1.0]


def test_generate_event_deterministic_with_seed() -> None:
    """Test generate_event is deterministic with random seed"""
    archetype = EVENT_ARCHETYPES[0]

    random.seed(42)
    event1 = generate_event(archetype)

    random.seed(42)
    event2 = generate_event(archetype)

    np.testing.assert_array_equal(event1, event2)


# ------------------------------
#  generate_event_for_user
# ------------------------------

def test_generate_event_for_user_excludes_blocked_tags() -> None:
    """Test generate_event_for_user excludes optional tags in excluded_tags"""
    archetype = EVENT_ARCHETYPES[0]  # rap_concert with optional ["wild", "drink", "party"]
    excluded_tags = {"wild", "drink"}

    # Generate multiple events to test probabilistic exclusion
    events = [generate_event_for_user(archetype, excluded_tags) for _ in range(10)]

    for event in events:
        if "wild" in TAG_IDX:
            assert event[TAG_IDX["wild"]] == 0.0
        if "drink" in TAG_IDX:
            assert event[TAG_IDX["drink"]] == 0.0


def test_generate_event_for_user_includes_required_tags() -> None:
    """Test generate_event_for_user still includes required tags even if blocked"""
    archetype = EVENT_ARCHETYPES[0]  # rap_concert: ["concert", "rap", "music"]
    excluded_tags = {"concert", "rap"}  # Block required tags

    event = generate_event_for_user(archetype, excluded_tags)

    # Required tags should still be included
    assert event[TAG_IDX["concert"]] == 1.0
    assert event[TAG_IDX["rap"]] == 1.0
    assert event[TAG_IDX["music"]] == 1.0


def test_generate_event_for_user_returns_correct_shape() -> None:
    """Test generate_event_for_user returns (NUM_TAGS,) array (no extra features)"""
    archetype = EVENT_ARCHETYPES[0]
    excluded_tags: set[str] = set()

    event = generate_event_for_user(archetype, excluded_tags)

    assert event.shape == (NUM_TAGS,)


# ------------------------------
#  simulate_user
# ------------------------------

def test_simulate_user_returns_correct_shapes() -> None:
    """Test simulate_user returns three (NUM_TAGS,) arrays and three lists"""
    persona = USER_PERSONAS[0]

    att_w, int_w, blk_w, att_idx, int_idx, blk_idx = simulate_user(persona)

    assert att_w.shape == (NUM_TAGS,)
    assert int_w.shape == (NUM_TAGS,)
    assert blk_w.shape == (NUM_TAGS,)
    assert isinstance(att_idx, list)
    assert isinstance(int_idx, list)
    assert isinstance(blk_idx, list)


def test_simulate_user_returns_float32() -> None:
    """Test simulate_user returns float32 arrays"""
    persona = USER_PERSONAS[0]

    att_w, int_w, blk_w, _, _, _ = simulate_user(persona)

    assert att_w.dtype == np.float32
    assert int_w.dtype == np.float32
    assert blk_w.dtype == np.float32


def test_simulate_user_attended_weights_positive() -> None:
    """Test attended weights are non-negative"""
    persona = USER_PERSONAS[0]

    att_w, _, _, _, _, _ = simulate_user(persona)

    assert np.all(att_w >= 0.0)


def test_simulate_user_interested_weights_positive() -> None:
    """Test interested weights are non-negative"""
    persona = USER_PERSONAS[0]

    _, int_w, _, _, _, _ = simulate_user(persona)

    assert np.all(int_w >= 0.0)


def test_simulate_user_blocked_weights_positive() -> None:
    """Test blocked weights are non-negative"""
    persona = USER_PERSONAS[0]

    _, _, blk_w, _, _, _ = simulate_user(persona)

    assert np.all(blk_w >= 0.0)


def test_simulate_user_index_lists_valid() -> None:
    """Test archetype index lists contain valid indices"""
    persona = USER_PERSONAS[0]

    _, _, _, att_idx, int_idx, blk_idx = simulate_user(persona)

    num_archetypes = len(EVENT_ARCHETYPES)

    for idx in att_idx:
        assert 0 <= idx < num_archetypes
    for idx in int_idx:
        assert 0 <= idx < num_archetypes
    for idx in blk_idx:
        assert 0 <= idx < num_archetypes


# ------------------------------
#  generate_users
# ------------------------------

def test_generate_users_returns_correct_shapes() -> None:
    """Test generate_users returns (NUM_USERS, 3*NUM_TAGS) array and history list"""
    user_features, interaction_history = generate_users()

    # Check user_features shape
    assert user_features.ndim == 2
    assert user_features.shape[1] == 3 * NUM_TAGS

    # Check interaction_history length matches users
    assert len(interaction_history) == user_features.shape[0]


def test_generate_users_returns_float32() -> None:
    """Test generate_users returns float32 array"""
    user_features, _ = generate_users()

    assert user_features.dtype == np.float32


def test_generate_users_interaction_history_format() -> None:
    """Test interaction_history contains tuples of three lists"""
    _, interaction_history = generate_users()

    for history in interaction_history:
        assert isinstance(history, tuple)
        assert len(history) == 3
        assert isinstance(history[0], list)
        assert isinstance(history[1], list)
        assert isinstance(history[2], list)


def test_generate_users_includes_cold_start_users() -> None:
    """Test generate_users includes some cold-start (all-zero) users"""
    user_features, interaction_history = generate_users()
    zero_users = np.all(user_features == 0, axis=1).sum()
    assert zero_users > 0


def test_generate_users_deterministic_with_seed() -> None:
    """Test generate_users is deterministic with random seed"""

    random.seed(42)
    np.random.seed(42)
    users1, _ = generate_users()

    random.seed(42)
    np.random.seed(42)
    users2, _ = generate_users()

    np.testing.assert_array_equal(users1, users2)


# ------------------------------
#  generate_events
# ------------------------------

def test_generate_events_returns_correct_shape() -> None:
    """Test generate_events returns (NUM_EVENTS, NUM_TAGS + 4) array"""
    if MODULE_PATH == 'training.generate_training_data':
        from training.generate_training_data import NUM_EVENTS
    else:
        from generate_training_data import NUM_EVENTS

    events = generate_events()

    assert events.shape == (NUM_EVENTS, NUM_TAGS + 4)


def test_generate_events_returns_float32() -> None:
    """Test generate_events returns float32 array"""
    events = generate_events()

    assert events.dtype == np.float32


def test_generate_events_has_valid_values() -> None:
    """Test generate_events produces valid feature values"""
    events = generate_events()

    # Tag multihot should be binary
    tags = events[:, :NUM_TAGS]
    assert np.all((tags == 0) | (tags == 1))

    # Normalized features should be in [0, 1]
    tag_count_norm = events[:, NUM_TAGS]
    day_norm = events[:, NUM_TAGS + 1]
    hour_norm = events[:, NUM_TAGS + 2]
    is_free = events[:, NUM_TAGS + 3]

    assert np.all((tag_count_norm >= 0) & (tag_count_norm <= 1))
    assert np.all((day_norm >= 0) & (day_norm <= 1))
    assert np.all((hour_norm >= 0) & (hour_norm <= 1))
    assert np.all((is_free == 0) | (is_free == 1))


# ------------------------------
#  cosine_sim_attended
# ------------------------------

def test_cosine_sim_attended_returns_correct_shape() -> None:
    """Test cosine_sim_attended returns (num_users, num_events) matrix"""
    num_users = 10
    num_events = 20

    user_features = np.random.rand(num_users, 3 * NUM_TAGS).astype(np.float32)
    event_features = np.random.rand(num_events, NUM_TAGS + 4).astype(np.float32)

    sim = cosine_sim_attended(user_features, event_features)

    assert sim.shape == (num_users, num_events)


def test_cosine_sim_attended_values_in_range() -> None:
    """Test cosine similarity values are in [-1, 1]"""
    num_users = 10
    num_events = 20

    user_features = np.random.rand(num_users, 3 * NUM_TAGS).astype(np.float32)
    event_features = np.random.rand(num_events, NUM_TAGS + 4).astype(np.float32)

    sim = cosine_sim_attended(user_features, event_features)

    assert np.all(sim >= -1.0)
    assert np.all(sim <= 1.0)


def test_cosine_sim_attended_identical_vectors() -> None:
    """Test cosine similarity is 1.0 for identical attended/event vectors"""
    # Create user and event with identical tag vectors
    user_features = np.zeros((1, 3 * NUM_TAGS), dtype=np.float32)
    event_features = np.zeros((1, NUM_TAGS + 4), dtype=np.float32)

    # Set attended slice and event tags to same values
    user_features[0, :NUM_TAGS] = 1.0
    event_features[0, :NUM_TAGS] = 1.0

    sim = cosine_sim_attended(user_features, event_features)

    assert np.isclose(sim[0, 0], 1.0, atol=1e-6)


def test_cosine_sim_attended_orthogonal_vectors() -> None:
    """Test cosine similarity is 0.0 for orthogonal vectors"""
    user_features = np.zeros((1, 3 * NUM_TAGS), dtype=np.float32)
    event_features = np.zeros((1, NUM_TAGS + 4), dtype=np.float32)

    # Set non-overlapping tags
    user_features[0, 0] = 1.0
    event_features[0, 1] = 1.0

    sim = cosine_sim_attended(user_features, event_features)

    assert np.isclose(sim[0, 0], 0.0, atol=1e-6)


# ------------------------------
#  mine_triplets
# ------------------------------

def test_mine_triplets_returns_correct_shape() -> None:
    """Test mine_triplets returns (N, 3) array"""
    num_users = 10
    user_features = np.random.rand(num_users, 3 * NUM_TAGS).astype(np.float32)
    event_features = np.random.rand(100, NUM_TAGS + 4).astype(np.float32)
    interaction_history: list[tuple[list[int], list[int], list[int]]] = [([], [], []) for _ in range(num_users)]

    triplets = mine_triplets(user_features, event_features, interaction_history)

    assert triplets.ndim == 2
    assert triplets.shape[1] == 3
    # Should have some triplets generated
    assert triplets.shape[0] > 0


def test_mine_triplets_returns_int32() -> None:
    """Test mine_triplets returns int32 array"""
    user_features = np.random.rand(10, 3 * NUM_TAGS).astype(np.float32)
    event_features = np.random.rand(100, NUM_TAGS + 4).astype(np.float32)
    interaction_history: list[tuple[list[int], list[int], list[int]]] = [([], [], []) for _ in range(10)]

    triplets = mine_triplets(user_features, event_features, interaction_history)

    assert triplets.dtype == np.int32


def test_mine_triplets_valid_indices() -> None:
    """Test mine_triplets produces valid user and event indices"""
    num_users = 10
    num_events = 100

    user_features = np.random.rand(num_users, 3 * NUM_TAGS).astype(np.float32)
    event_features = np.random.rand(num_events, NUM_TAGS + 4).astype(np.float32)
    interaction_history: list[tuple[list[int], list[int], list[int]]] = [([], [], []) for _ in range(num_users)]

    triplets = mine_triplets(user_features, event_features, interaction_history)

    # Check user indices
    assert np.all(triplets[:, 0] >= 0)
    assert np.all(triplets[:, 0] < num_users)

    # Check event indices
    assert np.all(triplets[:, 1] >= 0)
    assert np.all(triplets[:, 1] < num_events)
    assert np.all(triplets[:, 2] >= 0)
    assert np.all(triplets[:, 2] < num_events)


def test_mine_triplets_positive_margin() -> None:
    """Test mined triplets generally have positive similarity margin"""
    user_features = np.random.rand(10, 3 * NUM_TAGS).astype(np.float32)
    event_features = np.random.rand(100, NUM_TAGS + 4).astype(np.float32)
    interaction_history: list[tuple[list[int], list[int], list[int]]] = [([], [], []) for _ in range(10)]

    triplets = mine_triplets(user_features, event_features, interaction_history)

    # Compute similarity scores
    u_att = user_features[triplets[:, 0], :NUM_TAGS]
    pos_tags = event_features[triplets[:, 1], :NUM_TAGS]
    neg_tags = event_features[triplets[:, 2], :NUM_TAGS]

    pos_sim = (u_att * pos_tags).sum(axis=1)
    neg_sim = (u_att * neg_tags).sum(axis=1)
    margin = pos_sim - neg_sim

    assert (margin > 0).mean() > 0.5


# ------------------------------
#  main
# ------------------------------

@patch(f'{MODULE_PATH}.np.save')
@patch(f'{MODULE_PATH}.Path.mkdir')
@patch('builtins.open', new_callable=mock_open)
def test_main_creates_output_directory(mock_file: MagicMock, mock_mkdir: MagicMock, mock_np_save: MagicMock) -> None:
    """Test main() creates output directory"""
    random.seed(42)
    np.random.seed(42)

    main()

    mock_mkdir.assert_called_once_with(parents=True, exist_ok=True)


@patch(f'{MODULE_PATH}.np.save')
@patch(f'{MODULE_PATH}.Path.mkdir')
@patch('builtins.open', new_callable=mock_open)
def test_main_saves_user_features(mock_file: MagicMock, mock_mkdir: MagicMock, mock_np_save: MagicMock) -> None:
    """Test main() saves user_features.npy"""
    random.seed(42)
    np.random.seed(42)

    main()

    # Check np.save was called for user_features
    save_calls = [call[0][0] for call in mock_np_save.call_args_list]
    assert any('user_features.npy' in str(path) for path in save_calls)


@patch(f'{MODULE_PATH}.np.save')
@patch(f'{MODULE_PATH}.Path.mkdir')
@patch('builtins.open', new_callable=mock_open)
def test_main_saves_event_features(mock_file: MagicMock, mock_mkdir: MagicMock, mock_np_save: MagicMock) -> None:
    """Test main() saves event_features.npy"""
    random.seed(42)
    np.random.seed(42)

    main()

    save_calls = [call[0][0] for call in mock_np_save.call_args_list]
    assert any('event_features.npy' in str(path) for path in save_calls)


@patch(f'{MODULE_PATH}.np.save')
@patch(f'{MODULE_PATH}.Path.mkdir')
@patch('builtins.open', new_callable=mock_open)
def test_main_saves_triplets(mock_file: MagicMock, mock_mkdir: MagicMock, mock_np_save: MagicMock) -> None:
    """Test main() saves triplets.npy"""
    random.seed(42)
    np.random.seed(42)

    main()

    save_calls = [call[0][0] for call in mock_np_save.call_args_list]
    assert any('triplets.npy' in str(path) for path in save_calls)


@patch(f'{MODULE_PATH}.np.save')
@patch(f'{MODULE_PATH}.Path.mkdir')
@patch('builtins.open', new_callable=mock_open)
def test_main_saves_tag_index_json(mock_file: MagicMock, mock_mkdir: MagicMock, mock_np_save: MagicMock) -> None:
    """Test main() saves tag_index.json"""
    random.seed(42)
    np.random.seed(42)

    main()

    # Check that json file was opened for writing
    assert mock_file.called
    # Check for tag_index.json in the call
    file_calls = [str(call) for call in mock_file.call_args_list]
    assert any('tag_index.json' in call for call in file_calls)


@patch(f'{MODULE_PATH}.np.save')
@patch(f'{MODULE_PATH}.Path.mkdir')
@patch('builtins.open', new_callable=mock_open)
def test_main_calls_np_save_three_times(mock_file: MagicMock, mock_mkdir: MagicMock, mock_np_save: MagicMock) -> None:
    """Test main() calls np.save three times (user, event, triplets)"""
    random.seed(42)
    np.random.seed(42)

    main()

    assert mock_np_save.call_count == 3


@patch(f'{MODULE_PATH}.np.save')
@patch(f'{MODULE_PATH}.Path.mkdir')
@patch('builtins.open', new_callable=mock_open)
def test_main_uses_random_seed(mock_file: MagicMock, mock_mkdir: MagicMock, mock_np_save: MagicMock) -> None:
    """Test main() sets random seed for reproducibility"""

    main()
    first_user_features = mock_np_save.call_args_list[0][0][1]

    mock_np_save.reset_mock()

    main()
    second_user_features = mock_np_save.call_args_list[0][0][1]

    np.testing.assert_array_equal(first_user_features, second_user_features)