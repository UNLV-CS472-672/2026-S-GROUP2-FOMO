import os
import sys
import pandas as pd
import numpy as np
import pytest
from unittest.mock import patch, MagicMock
from typing import Generator

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "friendRec"))
from friendRecs import (
    join_user_events,
    raw_matrix_events,
    raw_matrix_eventTags,
    raw_matrix_postTags,
    build_similarity_matrix,
    get_user_scores,
    sim_scores_weighted,
    upsert_friend_recs,
    main_one_user,
    main_all_users,
)


# ------------------------------
#  FAKE MOCK DATA
# ------------------------------

@pytest.fixture
def sample_users() -> list[dict[str, str]]:
    return [
        {"_id": "u1", "name": "seed|alice"},
        {"_id": "u2", "name": "seed|bob"},
        {"_id": "u3", "name": "seed|reece"},
    ]

@pytest.fixture
def sample_events() -> list[dict[str, str]]:
    return [
        {"_id": "e1", "name": "Hackathon"},
        {"_id": "e2", "name": "Concert"},
        {"_id": "e3", "name": "GameNight"},
    ]

@pytest.fixture
def sample_users_to_events() -> list[dict[str, str]]:
    return [
        {"userId": "u1", "eventId": "e1"},
        {"userId": "u1", "eventId": "e2"},
        {"userId": "u2", "eventId": "e1"},
        {"userId": "u3", "eventId": "e3"},
    ]

@pytest.fixture
def sample_tags() -> list[dict[str, str]]:
    return [
        {"_id": "t1", "name": "tech"},
        {"_id": "t2", "name": "music"},
    ]

@pytest.fixture
def sample_eventTags() -> list[dict[str, str]]:
    return [
        {"eventId": "e1", "tagId": "t1"},
        {"eventId": "e2", "tagId": "t2"},
    ]

@pytest.fixture
def sample_posts() -> list[dict[str, str]]:
    return [
        {"_id": "p1", "authorId": "u1"},
        {"_id": "p2", "authorId": "u2"},
    ]

@pytest.fixture
def sample_postTags() -> list[dict[str, str]]:
    return [
        {"postId": "p1", "tagId": "t1"},
        {"postId": "p2", "tagId": "t2"},
    ]

@pytest.fixture
def sample_similarity_df() -> pd.DataFrame:
    data = {
        "Hackathon": [1, 1, 0],
        "Concert":   [1, 0, 0],
        "GameNight": [0, 0, 1],
    }
    return pd.DataFrame(data, index=["u1", "u2", "u3"])

@pytest.fixture
def sample_score_df() -> pd.DataFrame:
    return pd.DataFrame({"similarity_score": [0.4, 0.6]}, index=["u1", "u2"])


@pytest.fixture(autouse=True)
def mock_queries(
    sample_users: list[dict[str, str]],
    sample_events: list[dict[str, str]],
    sample_users_to_events: list[dict[str, str]],
    sample_tags: list[dict[str, str]],
    sample_eventTags: list[dict[str, str]],
    sample_posts: list[dict[str, str]],
    sample_postTags: list[dict[str, str]],
) -> Generator[dict[str, MagicMock], None, None]:
    dispatch = {
        "attendance": sample_users_to_events,
        "events": sample_events,
        "eventTags": sample_eventTags,
        "tags": sample_tags,
        "users": sample_users,
        "posts": sample_posts,
        "postTags": sample_postTags,
    }
    with patch("friendRecs.queries.query_all", side_effect=lambda t: dispatch.get(t, [])), \
         patch("friendRecs.queries.get_friend_ids", return_value=[]) as mock_get_friend_ids, \
         patch("friendRecs.queries.upsert_friend_recs") as mock_upsert_recs, \
         patch("friendRecs.queries.user_exists", return_value=True) as mock_user_exists, \
         patch("friendRecs.queries.get_all_user_ids", return_value=["u1", "u2"]) as mock_get_ids:
        yield {
            "get_friend_ids": mock_get_friend_ids,
            "upsert_friend_recs": mock_upsert_recs,
            "user_exists": mock_user_exists,
            "get_all_user_ids": mock_get_ids,
        }


# ------------------------------
#  join_user_events()
# ------------------------------

def test_join_user_events_returns_dataframe() -> None:
    result = join_user_events()
    assert isinstance(result, pd.DataFrame)

def test_join_user_events_has_correct_columns() -> None:
    result = join_user_events()
    assert "user_id" in result.columns
    assert "eventId" in result.columns

def test_join_user_events_correct_row_count(sample_users_to_events: list[dict[str, str]]) -> None:
    result = join_user_events()
    assert len(result) == len(sample_users_to_events)

def test_join_user_events_correct_values() -> None:
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

def test_raw_matrix_events_returns_dataframe() -> None:
    result = raw_matrix_events()
    assert isinstance(result, pd.DataFrame)

def test_raw_matrix_events_values_are_numbers() -> None:
    result = raw_matrix_events()
    assert all(np.issubdtype(dtype, np.number) for dtype in result.dtypes)

def test_raw_matrix_events_users_are_rows() -> None:
    result = raw_matrix_events()
    assert "u1" in result.index

def test_raw_matrix_events_events_are_columns() -> None:
    result = raw_matrix_events()
    assert "Hackathon" in result.columns


# ------------------------------
#  raw_matrix_eventTags()
# ------------------------------

def test_raw_matrix_eventTags_returns_dataframe() -> None:
    result = raw_matrix_eventTags()
    assert isinstance(result, pd.DataFrame)

def test_raw_matrix_eventTags_values_are_numbers() -> None:
    result = raw_matrix_eventTags()
    assert all(np.issubdtype(dtype, np.number) for dtype in result.dtypes)

def test_raw_matrix_eventTags_rows_are_user() -> None:
    result = raw_matrix_eventTags()
    assert "u1" in result.index
    assert "u2" in result.index

def test_raw_matrix_eventTags_columns_are_tags() -> None:
    result = raw_matrix_eventTags()
    assert "tech" in result.columns
    assert "music" in result.columns


# ------------------------------
#  raw_matrix_postTags()
# ------------------------------

def test_raw_matrix_postTags_returns_dataframe() -> None:
    result = raw_matrix_postTags()
    assert isinstance(result, pd.DataFrame)

def test_raw_matrix_postTags_values_are_numbers() -> None:
    result = raw_matrix_postTags()
    assert all(np.issubdtype(dtype, np.number) for dtype in result.dtypes)

def test_raw_matrix_postTags_rows_are_users() -> None:
    result = raw_matrix_postTags()
    assert "u1" in result.index
    assert "u2" in result.index

def test_raw_matrix_postTags_columns_are_tags() -> None:
    result = raw_matrix_postTags()
    assert "tech" in result.columns
    assert "music" in result.columns


# ------------------------------
#  build_similarity_matrix() / get_user_scores()
# ------------------------------

def test_build_similarity_matrix_returns_dataframe(sample_similarity_df: pd.DataFrame) -> None:
    result = build_similarity_matrix(sample_similarity_df)
    assert isinstance(result, pd.DataFrame)

def test_build_similarity_matrix_values_rows_are_users(sample_similarity_df: pd.DataFrame) -> None:
    result = build_similarity_matrix(sample_similarity_df)
    assert "u2" in result.index
    assert "u3" in result.index

def test_build_similarity_matrix_is_square(sample_similarity_df: pd.DataFrame) -> None:
    result = build_similarity_matrix(sample_similarity_df)
    assert result.shape[0] == result.shape[1]

def test_build_similarity_matrix_empty_returns_empty_dataframe() -> None:
    result = build_similarity_matrix(pd.DataFrame())
    assert result.empty

def test_get_user_scores_columns_are_similarity_score(sample_similarity_df: pd.DataFrame) -> None:
    sim_matrix = build_similarity_matrix(sample_similarity_df)
    result = get_user_scores(sim_matrix, "u1")
    assert result.shape[1] == 1
    assert result.columns[0] == "similarity_score"

def test_get_user_scores_rows_are_users(sample_similarity_df: pd.DataFrame) -> None:
    sim_matrix = build_similarity_matrix(sample_similarity_df)
    result = get_user_scores(sim_matrix, "u1")
    assert "u2" in result.index
    assert "u3" in result.index

def test_get_user_scores_missing_user_returns_zeros(sample_similarity_df: pd.DataFrame) -> None:
    sim_matrix = build_similarity_matrix(sample_similarity_df)
    result = get_user_scores(sim_matrix, "seed|gorilla-sushi")
    assert isinstance(result, pd.DataFrame)
    assert (result["similarity_score"] == 0.0).all()

def test_get_user_scores_excludes_self(sample_similarity_df: pd.DataFrame) -> None:
    sim_matrix = build_similarity_matrix(sample_similarity_df)
    result = get_user_scores(sim_matrix, "u1")
    assert "u1" not in result.index


# ------------------------------
#  sim_scores_weighted()
# ------------------------------

def test_sim_scores_weighted_returns_dataframe(sample_score_df: pd.DataFrame) -> None:
    result = sim_scores_weighted(sample_score_df, sample_score_df, sample_score_df)
    assert isinstance(result, pd.DataFrame)

def test_sim_scores_weighted_values_rows_are_users(sample_score_df: pd.DataFrame) -> None:
    result = sim_scores_weighted(sample_score_df, sample_score_df, sample_score_df)
    assert "u1" in result.index
    assert "u2" in result.index

def test_simscores_weighted_values_col_is_similarity_score(sample_score_df: pd.DataFrame) -> None:
    result = sim_scores_weighted(sample_score_df, sample_score_df, sample_score_df)
    assert result.shape[1] == 1
    assert result.columns[0] == "similarity_score"

def test_sim_scores_weighted_correct_calculation(sample_score_df: pd.DataFrame) -> None:
    result = sim_scores_weighted(sample_score_df, sample_score_df, sample_score_df)
    expected = sample_score_df * 0.80 + sample_score_df * 0.15 + sample_score_df * 0.05
    pd.testing.assert_frame_equal(result, expected)


# ------------------------------
#  upsert_friend_recs()
# ------------------------------

def test_upsert_friend_recs_correct_rec_count(
    mock_queries: dict[str, MagicMock], sample_score_df: pd.DataFrame
) -> None:
    upsert_friend_recs(sample_score_df, "u1", 2)
    _, recs = mock_queries["upsert_friend_recs"].call_args.args
    assert len(recs) == 2

def test_upsert_friend_recs_friend_filtering(
    mock_queries: dict[str, MagicMock], sample_score_df: pd.DataFrame
) -> None:
    mock_queries["get_friend_ids"].return_value = ["u2"]
    upsert_friend_recs(sample_score_df, "u1", 2)
    _, recs = mock_queries["upsert_friend_recs"].call_args.args
    assert len(recs) == 1
    assert recs[0]["userId"] == "u1"

def test_upsert_friend_recs_requester_filtering(
    mock_queries: dict[str, MagicMock], sample_score_df: pd.DataFrame
) -> None:
    upsert_friend_recs(sample_score_df, "u1", 2)
    _, recs = mock_queries["upsert_friend_recs"].call_args.args
    rec_ids = [r["userId"] for r in recs]
    assert rec_ids == ["u2", "u1"]

def test_upsert_friend_recs_recipient_filtering(
    mock_queries: dict[str, MagicMock], sample_score_df: pd.DataFrame
) -> None:
    mock_queries["get_friend_ids"].return_value = ["u1"]
    upsert_friend_recs(sample_score_df, "u2", 2)
    _, recs = mock_queries["upsert_friend_recs"].call_args.args
    rec_ids = [r["userId"] for r in recs]
    assert "u1" not in rec_ids

def test_upsert_friend_recs_pending_not_filtered(
    mock_queries: dict[str, MagicMock], sample_score_df: pd.DataFrame
) -> None:
    upsert_friend_recs(sample_score_df, "u1", 2)
    _, recs = mock_queries["upsert_friend_recs"].call_args.args
    assert len(recs) == 2

def test_upsert_friend_recs_rejected_not_filtered(
    mock_queries: dict[str, MagicMock], sample_score_df: pd.DataFrame
) -> None:
    upsert_friend_recs(sample_score_df, "u1", 2)
    _, recs = mock_queries["upsert_friend_recs"].call_args.args
    assert len(recs) == 2

def test_upsert_friend_recs_top_scores_selected(
    mock_queries: dict[str, MagicMock], sample_score_df: pd.DataFrame
) -> None:
    upsert_friend_recs(sample_score_df, "u1", 2)
    _, recs = mock_queries["upsert_friend_recs"].call_args.args
    scores = [r["score"] for r in recs]
    assert scores == sorted(scores, reverse=True)

def test_upsert_friend_recs_calls_mutation(
    mock_queries: dict[str, MagicMock], sample_score_df: pd.DataFrame
) -> None:
    upsert_friend_recs(sample_score_df, "u1", 2)
    mock_queries["upsert_friend_recs"].assert_called_once()


# ------------------------------
#  main_one_user()
# ------------------------------

@pytest.fixture
def mock_main_dependencies(
    mock_queries: dict[str, MagicMock],
) -> Generator[dict[str, MagicMock], None, None]:
    with patch("friendRecs.raw_matrix_events")    as mock_raw_events, \
         patch("friendRecs.raw_matrix_eventTags") as mock_raw_event_tags, \
         patch("friendRecs.raw_matrix_postTags")  as mock_raw_post_tags, \
         patch("friendRecs.build_similarity_matrix") as mock_build_matrix, \
         patch("friendRecs.get_user_scores")       as mock_get_user_scores, \
         patch("friendRecs.sim_scores_weighted")  as mock_weighted, \
         patch("friendRecs.upsert_friend_recs")   as mock_upsert:

        mock_raw_events.return_value     = MagicMock()
        mock_raw_event_tags.return_value = MagicMock()
        mock_raw_post_tags.return_value  = MagicMock()
        mock_build_matrix.return_value   = MagicMock()
        mock_get_user_scores.return_value = MagicMock()
        mock_weighted.return_value       = MagicMock()

        yield {
            "user_exists":             mock_queries["user_exists"],
            "raw_matrix_events":       mock_raw_events,
            "raw_matrix_eventTags":    mock_raw_event_tags,
            "raw_matrix_postTags":     mock_raw_post_tags,
            "build_similarity_matrix": mock_build_matrix,
            "get_user_scores":         mock_get_user_scores,
            "sim_scores_weighted":     mock_weighted,
            "upsert_friend_recs":      mock_upsert,
        }

def test_main_one_user_raises_if_user_not_found(mock_main_dependencies: dict[str, MagicMock]) -> None:
    mock_main_dependencies["user_exists"].return_value = False
    with pytest.raises(Exception):
        main_one_user("gorilla-sushi", 5)

def test_main_one_user_calls_all_raw_matrix_functions(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main_one_user("alice", 5)
    mock_main_dependencies["raw_matrix_events"].assert_called_once()
    mock_main_dependencies["raw_matrix_eventTags"].assert_called_once()
    mock_main_dependencies["raw_matrix_postTags"].assert_called_once()

def test_main_one_user_calls_sim_scores_weighted(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main_one_user("alice", 5)
    mock_main_dependencies["sim_scores_weighted"].assert_called_once()

def test_main_one_user_calls_upsert_friend_recs(mock_main_dependencies: dict[str, MagicMock]) -> None:
    main_one_user("alice", 5)
    mock_main_dependencies["upsert_friend_recs"].assert_called_once()


# ------------------------------
#  main_all_users()
# ------------------------------

@pytest.fixture
def mock_main_all_users_dependencies(
    mock_queries: dict[str, MagicMock],
) -> Generator[dict[str, MagicMock | list[str]], None, None]:
    user_ids = ["u1", "u2"]
    mock_queries["get_all_user_ids"].return_value = user_ids

    with patch("friendRecs.raw_matrix_events") as mock_raw_events, \
         patch("friendRecs.raw_matrix_eventTags") as mock_raw_event_tags, \
         patch("friendRecs.raw_matrix_postTags") as mock_raw_post_tags, \
         patch("friendRecs.build_similarity_matrix") as mock_build_matrix, \
         patch("friendRecs.get_user_scores") as mock_get_user_scores, \
         patch("friendRecs.sim_scores_weighted") as mock_weighted, \
         patch("friendRecs.upsert_friend_recs") as mock_upsert:

        mock_raw_events.return_value = MagicMock()
        mock_raw_event_tags.return_value = MagicMock()
        mock_raw_post_tags.return_value = MagicMock()
        mock_build_matrix.return_value = MagicMock()
        mock_get_user_scores.return_value = MagicMock()
        mock_weighted.return_value = MagicMock()

        yield {
            "user_ids":                user_ids,
            "get_all_user_ids":        mock_queries["get_all_user_ids"],
            "raw_matrix_events":       mock_raw_events,
            "raw_matrix_eventTags":    mock_raw_event_tags,
            "raw_matrix_postTags":     mock_raw_post_tags,
            "build_similarity_matrix": mock_build_matrix,
            "get_user_scores":         mock_get_user_scores,
            "sim_scores_weighted":     mock_weighted,
            "upsert_friend_recs":      mock_upsert,
        }

def test_main_all_users_builds_raw_matrices_once(mock_main_all_users_dependencies: dict[str, MagicMock]) -> None:
    main_all_users(5)
    mock_main_all_users_dependencies["raw_matrix_events"].assert_called_once()
    mock_main_all_users_dependencies["raw_matrix_eventTags"].assert_called_once()
    mock_main_all_users_dependencies["raw_matrix_postTags"].assert_called_once()

def test_main_all_users_builds_similarity_matrices_once(
    mock_main_all_users_dependencies: dict[str, MagicMock],
) -> None:
    main_all_users(5)
    assert mock_main_all_users_dependencies["build_similarity_matrix"].call_count == 3

def test_main_all_users_calls_get_user_scores_for_each_user_and_each_modality(
    mock_main_all_users_dependencies: dict[str, MagicMock],
) -> None:
    user_ids = mock_main_all_users_dependencies["user_ids"]
    main_all_users(5)
    assert mock_main_all_users_dependencies["get_user_scores"].call_count == 3 * len(user_ids)

def test_main_all_users_upserts_for_each_user(mock_main_all_users_dependencies: dict[str, MagicMock]) -> None:
    user_ids = mock_main_all_users_dependencies["user_ids"]
    main_all_users(5)
    assert mock_main_all_users_dependencies["upsert_friend_recs"].call_count == len(user_ids)
    called_user_ids = [call_args[0][1] for call_args in mock_main_all_users_dependencies["upsert_friend_recs"].call_args_list]
    assert called_user_ids == user_ids
