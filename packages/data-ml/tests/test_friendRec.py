import os
import sys
import pandas as pd
import numpy as np
import pytest
from unittest.mock import patch, MagicMock

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from friendRec import user_exists

from friendRec import (
    user_exists,
    join_user_events,
    raw_matrix_events,
    raw_matrix_eventTags,
    raw_matrix_postTags,
    similarity_score,
    sim_scores_weighted,
    upsert_friend_recs,
)

# ------------------------------
#  FAKE MOCK DATA
# ------------------------------
@pytest.fixture(autouse=True)
def mock_client():
    with patch("friendRec.client") as mock:
        yield mock
        
@pytest.fixture
def sample_users():
    return [
        {"_id": "u1", "name": "seed|alice"},
        {"_id": "u2", "name": "seed|bob"},
        {"_id": "u3", "name": "seed|charlie"},
    ]

@pytest.fixture
def sample_events():
    return [
        {"_id": "e1", "name": "Hackathon"},
        {"_id": "e2", "name": "Concert"},
        {"_id": "e3", "name": "GameNight"},
    ]

@pytest.fixture
def sample_users_to_events():
    return [
        {"userId": "u1", "eventId": "e1"},
        {"userId": "u1", "eventId": "e2"},
        {"userId": "u2", "eventId": "e1"},
        {"userId": "u3", "eventId": "e3"},
    ]

@pytest.fixture
def sample_tags():
    return [
        {"_id": "t1", "name": "tech"},
        {"_id": "t2", "name": "music"},
    ]

@pytest.fixture
def sample_event_tags():
    return [
        {"eventId": "e1", "tagId": "t1"},
        {"eventId": "e2", "tagId": "t2"},
    ]

@pytest.fixture
def sample_posts():
    return [
        {"_id": "p1", "authorId": "u1"},
        {"_id": "p2", "authorId": "u2"},
    ]


@pytest.fixture
def sample_post_tags():
    return [
        {"postId": "p1", "tagId": "t1"},
        {"postId": "p2", "tagId": "t2"},
    ]

@pytest.fixture
def sample_similarity_df():
    data = {
        "Hackathon": [1, 1, 0],
        "Concert":   [1, 0, 0],
        "GameNight": [0, 0, 1],
    }
    return pd.DataFrame(data, index=["seed|alice", "seed|bob", "seed|charlie"])



# ------------------------------
#  user_exists()
# ------------------------------

# Should return true, since this fake data DOES exist in "users"
def test_user_exists_returns_true(mock_client):
    mock_client.query.return_value = {"_id": "randomId", "name": "seed|manjot"}
    result = user_exists("Manjot")
    assert result is True
    mock_client.query.assert_called_once_with("query:user", {"name": "seed|manjot"})

# Should return false, since this fake data DOES NOT exist in "users"
def test_user_exists_returns_false(mock_client):
    mock_client.query.return_value = None
    result = user_exists("gorilla_sushi")
    assert result is False
    mock_client.query.assert_called_once_with("query:user", {"name": "seed|gorilla_sushi"})
    
    
    
# ------------------------------
#  user_exists()
# ------------------------------

# Ensure that the return value is a pandas df.
def test_join_user_events_returns_dataframe(mock_client, sample_users, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events]
    result = join_user_events()
    assert isinstance(result, pd.DataFrame)

# According to fake data, ensure column names are correct.
def test_join_user_events_has_correct_columns(mock_client, sample_users, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events]
    result = join_user_events()
    assert "user" in result.columns
    assert "event" in result.columns

# According to fake data, ensure # of rows are correct.
def test_join_user_events_correct_row_count(mock_client, sample_users, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events]
    result = join_user_events()
    assert len(result) == len(sample_users_to_events)

# According to fake data, ensure data entries are valid.
def test_join_user_events_correct_values(mock_client, sample_users, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events]
    result = join_user_events()
    assert "seed|alice" in result["user"].values
    assert "Hackathon" in result["event"].values