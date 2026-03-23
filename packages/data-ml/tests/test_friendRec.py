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
    main
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
        {"_id": "u3", "name": "seed|reece"},
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
def sample_eventTags():
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
def sample_postTags():
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
    return pd.DataFrame(data, index=["seed|alice", "seed|bob", "seed|reece"])

@pytest.fixture
def sample_score_df():
    return pd.DataFrame({"similarity_score": [0.4, 0.6]}, index=["alice", "bob"])





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
#  join_user_events()
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
    assert "seed|bob" in result["user"].values
    assert "seed|reece" in result["user"].values
    assert "Hackathon" in result["event"].values
    assert "Concert" in result["event"].values
    assert "GameNight" in result["event"].values
    
    
    
    
    
# ------------------------------
#  raw_matrix_events()
# ------------------------------

# Ensure that the return value is a pandas df.
def test_raw_matrix_events_returns_dataframe(mock_client, sample_users, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events]
    result = raw_matrix_events()
    assert isinstance(result, pd.DataFrame)

# Ensure that every cell in df is a number (dtype).
def test_raw_matrix_events_values_are_numbers(mock_client, sample_users, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events]
    result = raw_matrix_events()
    assert all(np.issubdtype(dtype, np.number) for dtype in result.dtypes)

# Ensure that the crosstab row index are users.
def test_raw_matrix_events_users_are_rows(mock_client, sample_users, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events]
    result = raw_matrix_events()
    assert "seed|alice" in result.index
    
# Ensure that the crosstab col index are events.
def test_raw_matrix_events_events_are_columns(mock_client, sample_users, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events]
    result = raw_matrix_events()
    assert "Hackathon" in result.columns
    

    
# ------------------------------
#  raw_matrix_eventTags()
# ------------------------------

# Ensure that the return value is a pandas df.
def test_raw_matrix_eventTags_returns_dataframe(mock_client, sample_users, sample_events, sample_users_to_events, sample_tags, sample_eventTags):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events, sample_eventTags, sample_tags]
    result = raw_matrix_eventTags()
    assert isinstance(result, pd.DataFrame)
    
# Ensure that every cell in df is a number (dtype).
def test_raw_matrix_eventTags_values_are_numbers(mock_client, sample_users, sample_events, sample_users_to_events, sample_tags, sample_eventTags):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events, sample_eventTags, sample_tags]
    result = raw_matrix_eventTags()
    assert all(np.issubdtype(dtype, np.number) for dtype in result.dtypes)

# Ensure that the crosstab row index are users.
def test_raw_matrix_eventTags_rows_are_user(mock_client, sample_users, sample_events, sample_users_to_events, sample_tags, sample_eventTags):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events, sample_eventTags, sample_tags]
    result = raw_matrix_eventTags()
    assert "seed|alice"  in result.index
    assert "seed|bob"    in result.index

# Ensure that the crosstab col index are tags.
def test_raw_matrix_eventTags_columns_are_tags(mock_client, sample_users, sample_events, sample_users_to_events, sample_tags, sample_eventTags):
    mock_client.query.side_effect = [sample_users, sample_users_to_events, sample_events, sample_eventTags, sample_tags]
    result = raw_matrix_eventTags()
    assert "tech"  in result.columns 
    assert "music" in result.columns
    
    

# ------------------------------
#  raw_matrix_postTags()
# ------------------------------

# Ensure that the return value is a pandas df.
def test_raw_matrix_postTags_returns_dataframe(mock_client, sample_users, sample_posts, sample_postTags, sample_tags):
    mock_client.query.side_effect = [sample_users, sample_posts, sample_postTags, sample_tags]
    result = raw_matrix_postTags()
    assert isinstance(result, pd.DataFrame)
    
# Ensure that the crosstab row index are users.
def test_raw_matrix_postTags_rows_are_users(mock_client, sample_users, sample_posts, sample_postTags, sample_tags):
    mock_client.query.side_effect = [sample_users, sample_posts, sample_postTags, sample_tags]
    result = raw_matrix_postTags()
    assert "seed|alice"  in result.index
    assert "seed|bob"    in result.index

# Ensure that the crosstab col index are tags.
def test_raw_matrix_postTags_columns_are_tags(mock_client, sample_users, sample_posts, sample_postTags, sample_tags):
    mock_client.query.side_effect = [sample_users, sample_posts, sample_postTags, sample_tags]
    result = raw_matrix_postTags()
    assert "tech"  in result.columns 
    assert "music" in result.columns




# ------------------------------
#  similarity_score()
# ------------------------------

# Ensure that the return value is a pandas df.
def test_similarity_score_returns_dataframe(sample_similarity_df):
    result = similarity_score(sample_similarity_df, "seed|alice")
    assert isinstance(result, pd.DataFrame)
            
# Ensure that the df row index are users.
def test_similarity_scores_values_rows_are_users(sample_similarity_df):
    result = similarity_score(sample_similarity_df, "seed|alice")
    assert "seed|bob"   in result.index
    assert "seed|reece" in result.index
    
# Ensure that df should be one column, similarity_score (shape = [?, 1]). 
def test_similarity_scores_values_col_is_similarity_score(sample_similarity_df):
    result = similarity_score(sample_similarity_df, "seed|alice")
    assert result.shape[1] == 1
    assert result.columns[0] == "similarity_score"

# Users not found should return a KeyError.
def test_similarity_score_handles_keyerror(sample_similarity_df):
    with pytest.raises(KeyError):
        similarity_score(sample_similarity_df, "seed|gorilla-sushi")
        
# df should not contain the user inputted.
def test_similarity_score_excludes_self(sample_similarity_df):
    result = similarity_score(sample_similarity_df, "seed|alice")
    assert "seed|alice" not in result.index
    
    
    
# ------------------------------
#  sim_scores_weighted()
# ------------------------------

# Ensure that the return value is a pandas df.
def test_sim_scores_weighted_returns_dataframe(sample_score_df):
    result = sim_scores_weighted(sample_score_df, sample_score_df, sample_score_df)
    assert isinstance(result, pd.DataFrame)

# Ensure that the df row index are users.
def test_sim_scores_weighted_values_rows_are_users(sample_score_df):
    result = sim_scores_weighted(sample_score_df, sample_score_df, sample_score_df)
    assert "alice" in result.index
    assert "bob"   in result.index
    
# Ensure that df should be one column, similarity_score (shape = [?, 1]). 
def test_simscores_weighted_values_col_is_similarity_score(sample_score_df):
    result = sim_scores_weighted(sample_score_df, sample_score_df, sample_score_df)
    assert result.shape[1] == 1
    assert result.columns[0] == "similarity_score"

# Ensure that multiplicands and summations are applied correctly.
def test_sim_scores_weighted_correct_calculation(sample_score_df):
    result = sim_scores_weighted(sample_score_df, sample_score_df, sample_score_df)
    expected = sample_score_df * 0.80 + sample_score_df * 0.15 + sample_score_df * 0.05
    pd.testing.assert_frame_equal(result, expected)
    
    
    


# ------------------------------
#  upsert_friend_recs()
# ------------------------------

# Since we currently only allow a maximum of 5 users, don't allow >5.
def test_upsert_friend_recs_exceed_recamt(mock_client, sample_score_df):
    with pytest.raises(Exception):
        upsert_friend_recs(sample_score_df, "alice", 6)

# Ensure that the final row amt is same as input rec_amt.
def test_upsert_friend_recs_correct_rec_count(mock_client, sample_score_df):
    upsert_friend_recs(sample_score_df, "alice", 2)
    call_kwargs = mock_client.mutation.call_args[0][1]
    assert len(call_kwargs["recs"]) == 2

# Ensure that the final df is sorted by top-first.
def test_upsert_friend_recs_top_scores_selected(mock_client, sample_score_df):
    upsert_friend_recs(sample_score_df, "alice", 2)
    call_kwargs = mock_client.mutation.call_args[0][1]
    scores = [r["score"] for r in call_kwargs["recs"]]
    assert scores == sorted(scores, reverse=True)

# Ensures that the ConvexClient mutation is actually being invoked.
def test_upsert_friend_recs_calls_mutation(mock_client, sample_score_df):
    upsert_friend_recs(sample_score_df, "alice", 2)
    mock_client.mutation.assert_called_once()

    

# ------------------------------
#  main()
# ------------------------------

def test_main_user_not_exist():
    with pytest.raises(Exception):
        main("gorilla-sushi", 5, False)
        
def test