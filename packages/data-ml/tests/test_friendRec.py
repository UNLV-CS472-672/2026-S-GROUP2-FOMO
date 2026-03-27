import os
import sys
import pandas as pd
import numpy as np
import pytest
from unittest.mock import patch, MagicMock

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
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
    return pd.DataFrame(data, index=["u1", "u2", "u3"])

@pytest.fixture
def sample_score_df():
    return pd.DataFrame({"similarity_score": [0.4, 0.6]}, index=["u1", "u2"])





# ------------------------------
#  user_exists()
# ------------------------------

# Should return true, since this fake data DOES exist in "users"
def test_user_exists_returns_true(mock_client):
    mock_client.query.return_value = {"_id": "u1", "name": "seed|alice"}
    result = user_exists("u1")
    assert result is True
    mock_client.query.assert_called_once_with("data_ml/users:userExists", {"userId": "u1"})

# Should return false, since this fake data DOES NOT exist in "users"
def test_user_exists_returns_false(mock_client):
    mock_client.query.return_value = None
    result = user_exists("u1")
    assert result is False
    mock_client.query.assert_called_once_with("data_ml/users:userExists", {"userId": "u1"})

    
    
    
    
    
# ------------------------------
#  join_user_events()
# ------------------------------

# Ensure that the return value is a pandas df.
def test_join_user_events_returns_dataframe(mock_client, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users_to_events, sample_events]
    result = join_user_events()
    assert isinstance(result, pd.DataFrame)

# According to fake data, ensure column names are correct.
def test_join_user_events_has_correct_columns(mock_client, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users_to_events, sample_events]
    result = join_user_events()
    assert "user_id" in result.columns
    assert "eventId" in result.columns

# According to fake data, ensure # of rows are correct.
def test_join_user_events_correct_row_count(mock_client, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users_to_events, sample_events]
    result = join_user_events()
    assert len(result) == len(sample_users_to_events)

# According to fake data, ensure data entries are valid.
def test_join_user_events_correct_values(mock_client, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users_to_events, sample_events]
    result = join_user_events()
    assert "u1" in result["user_id"].values
    assert "u2" in result["user_id"].values
    assert "u3" in result["user_id"].values
    assert "Hackathon" in result["event"].values
    assert "Concert" in result["event"].values
    assert "GameNight" in result["event"].values
    
    
    
    
    
# ------------------------------
#  raw_matrix_events()
# ------------------------------

# Ensure that the return value is a pandas df.
def test_raw_matrix_events_returns_dataframe(mock_client, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users_to_events, sample_events]
    result = raw_matrix_events()
    assert isinstance(result, pd.DataFrame)

# Ensure that every cell in df is a number (dtype).
def test_raw_matrix_events_values_are_numbers(mock_client, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users_to_events, sample_events]
    result = raw_matrix_events()
    assert all(np.issubdtype(dtype, np.number) for dtype in result.dtypes)

# Ensure that the crosstab row index are users.
def test_raw_matrix_events_users_are_rows(mock_client, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users_to_events, sample_events]
    result = raw_matrix_events()
    assert "u1" in result.index
    
# Ensure that the crosstab col index are events.
def test_raw_matrix_events_events_are_columns(mock_client, sample_events, sample_users_to_events):
    mock_client.query.side_effect = [sample_users_to_events, sample_events]
    result = raw_matrix_events()
    assert "Hackathon" in result.columns
    



    
# ------------------------------
#  raw_matrix_eventTags()
# ------------------------------

# Ensure that the return value is a pandas df.
def test_raw_matrix_eventTags_returns_dataframe(mock_client, sample_events, sample_users_to_events, sample_tags, sample_eventTags):
    mock_client.query.side_effect = [sample_users_to_events, sample_events, sample_eventTags, sample_tags]
    result = raw_matrix_eventTags()
    assert isinstance(result, pd.DataFrame)
    
# Ensure that every cell in df is a number (dtype).
def test_raw_matrix_eventTags_values_are_numbers(mock_client, sample_events, sample_users_to_events, sample_tags, sample_eventTags):
    mock_client.query.side_effect = [sample_users_to_events, sample_events, sample_eventTags, sample_tags]
    result = raw_matrix_eventTags()
    assert all(np.issubdtype(dtype, np.number) for dtype in result.dtypes)

# Ensure that the crosstab row index are users.
def test_raw_matrix_eventTags_rows_are_user(mock_client, sample_events, sample_users_to_events, sample_tags, sample_eventTags):
    mock_client.query.side_effect = [sample_users_to_events, sample_events, sample_eventTags, sample_tags]
    result = raw_matrix_eventTags()
    assert "u1"  in result.index
    assert "u2"    in result.index

# Ensure that the crosstab col index are tags.
def test_raw_matrix_eventTags_columns_are_tags(mock_client, sample_events, sample_users_to_events, sample_tags, sample_eventTags):
    mock_client.query.side_effect = [sample_users_to_events, sample_events, sample_eventTags, sample_tags]
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
    
# Ensure that every cell in df is a number (dtype).
def test_raw_matrix_postTags_values_are_numbers(mock_client, sample_users, sample_posts, sample_postTags, sample_tags):
    mock_client.query.side_effect = [sample_users, sample_posts, sample_postTags, sample_tags]
    result = raw_matrix_postTags()
    assert all(np.issubdtype(dtype, np.number) for dtype in result.dtypes)
    
# Ensure that the crosstab row index are users.
def test_raw_matrix_postTags_rows_are_users(mock_client, sample_users, sample_posts, sample_postTags, sample_tags):
    mock_client.query.side_effect = [sample_users, sample_posts, sample_postTags, sample_tags]
    result = raw_matrix_postTags()
    assert "u1"  in result.index
    assert "u2"    in result.index

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
    result = similarity_score(sample_similarity_df, "u1")
    assert isinstance(result, pd.DataFrame)
            
# Ensure that the df row index are users.
def test_similarity_scores_values_rows_are_users(sample_similarity_df):
    result = similarity_score(sample_similarity_df, "u1")
    assert "u2" in result.index
    assert "u3" in result.index
    
# Ensure that df should be one column, similarity_score (shape = [?, 1]). 
def test_similarity_scores_values_col_is_similarity_score(sample_similarity_df):
    result = similarity_score(sample_similarity_df, "u1")
    assert result.shape[1] == 1
    assert result.columns[0] == "similarity_score"

# Users not found should return a KeyError.
def test_similarity_score_handles_keyerror(sample_similarity_df):
    with pytest.raises(KeyError):
        similarity_score(sample_similarity_df, "seed|gorilla-sushi")
        
# df should not contain the user inputted.
def test_similarity_score_excludes_self(sample_similarity_df):
    result = similarity_score(sample_similarity_df, "u1")
    assert "u1" not in result.index
    
    
    
    
    
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
    assert "u1" in result.index
    assert "u2" in result.index
    
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
        upsert_friend_recs(sample_score_df, "u1", 6)

# Ensure that the final row amt is same as input rec_amt.
def test_upsert_friend_recs_correct_rec_count(mock_client, sample_score_df):
    mock_client.query.return_value = None  
    upsert_friend_recs(sample_score_df, "u1", 2)
    call_kwargs = mock_client.mutation.call_args[0][1]
    assert len(call_kwargs["recs"]) == 2
    
# Ensure that if friends exists, they are correctly filtered out.
def test_upsert_friend_recs_friend_filtering(mock_client, sample_score_df):
    mock_client.query.side_effect = [{"_id": "u2"}, None]
    upsert_friend_recs(sample_score_df, "u1", 2)
    call_kwargs = mock_client.mutation.call_args[0][1]
    recs = call_kwargs["recs"]
    assert recs[0]["userId"] == "u1"
    
# Ensure that the final df is sorted by top-first.
def test_upsert_friend_recs_top_scores_selected(mock_client, sample_score_df):
    upsert_friend_recs(sample_score_df, "u1", 2)
    call_kwargs = mock_client.mutation.call_args[0][1]
    scores = [r["score"] for r in call_kwargs["recs"]]
    assert scores == sorted(scores, reverse=True)

# Ensures that the ConvexClient mutation is actually being invoked.
def test_upsert_friend_recs_calls_mutation(mock_client, sample_score_df):
    upsert_friend_recs(sample_score_df, "u1", 2)
    mock_client.mutation.assert_called_once()

    

# ------------------------------
#  main()
# ------------------------------

# Simulate every function call within main.
@pytest.fixture 
def mock_main_dependencies(mock_client):
    
    with patch("friendRec.user_exists")          as mock_user_exists, \
         patch("friendRec.raw_matrix_events")    as mock_raw_events, \
         patch("friendRec.raw_matrix_eventTags") as mock_raw_event_tags, \
         patch("friendRec.raw_matrix_postTags")  as mock_raw_post_tags, \
         patch("friendRec.similarity_score")     as mock_sim_score, \
         patch("friendRec.sim_scores_weighted")  as mock_weighted, \
         patch("friendRec.upsert_friend_recs")   as mock_upsert:

        mock_user_exists.return_value    = True
        mock_raw_events.return_value     = MagicMock()
        mock_raw_event_tags.return_value = MagicMock()
        mock_raw_post_tags.return_value  = MagicMock()
        mock_sim_score.return_value      = MagicMock()
        mock_weighted.return_value       = MagicMock()

        yield {
            "user_exists":          mock_user_exists,
            "raw_matrix_events":    mock_raw_events,
            "raw_matrix_eventTags": mock_raw_event_tags,
            "raw_matrix_postTags":  mock_raw_post_tags,
            "similarity_score":     mock_sim_score,
            "sim_scores_weighted":  mock_weighted,
            "upsert_friend_recs":   mock_upsert,
            "client":               mock_client,
        }

# Ensure exception invoked when input "user" can't be found in Convex.
def test_main_raises_if_user_not_found(mock_main_dependencies):
    mock_main_dependencies["user_exists"].return_value = False
    with pytest.raises(Exception):
        main("gorilla-sushi", 5, False)

# Ensure seed function is not called when seed is false.
def test_main_does_not_seed_when_false(mock_main_dependencies):
    main("alice", 5, False)
    mock_main_dependencies["client"].mutation.assert_not_called()

# Ensure seed function is not called when seed is true.
def test_main_seeds_when_true(mock_main_dependencies):
    main("alice", 5, True)
    mock_main_dependencies["client"].mutation.assert_called_once_with("seed:seed")

# Ensure all raw_matrix functions are invoked once.
def test_main_calls_all_raw_matrix_functions(mock_main_dependencies):
    main("alice", 5, False)
    mock_main_dependencies["raw_matrix_events"].assert_called_once()
    mock_main_dependencies["raw_matrix_eventTags"].assert_called_once()
    mock_main_dependencies["raw_matrix_postTags"].assert_called_once()

# Ensure sim_scores_weighted() is invoked once.
def test_main_calls_sim_scores_weighted(mock_main_dependencies):
    main("alice", 5, False)
    mock_main_dependencies["sim_scores_weighted"].assert_called_once()

# Ensure upsert_friend_recs() is invoked once.
def test_main_calls_upsert_friend_recs(mock_main_dependencies):
    main("alice", 5, False)
    mock_main_dependencies["upsert_friend_recs"].assert_called_once()
    
