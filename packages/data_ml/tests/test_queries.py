import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from typing import Generator, Any

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "lib"))
import queries


# ------------------------------
#  FIXTURES
# ------------------------------

@pytest.fixture(autouse=True)
def env_vars() -> Generator[None, None, None]:
    with patch.dict(os.environ, {"CRON_SECRET": "test-secret", "CONVEX_SITE_URL": "https://example.convex.site"}):
        # Reload module-level vars that were already bound at import time
        queries._CRON_SECRET = "test-secret"
        queries._BASE_URL = "https://example.convex.site"
        yield
        queries._CRON_SECRET = os.getenv("CRON_SECRET")
        queries._BASE_URL = os.getenv("CONVEX_SITE_URL", "").rstrip("/")


def _mock_response(json_data: Any, status_code: int = 200) -> MagicMock:
    resp = MagicMock()
    resp.json.return_value = json_data
    resp.status_code = status_code
    resp.raise_for_status = MagicMock()
    return resp


# ------------------------------
#  _headers()
# ------------------------------

def test_headers_returns_cron_secret_header() -> None:
    headers = queries._headers()
    assert headers == {"x-cron-secret": "test-secret"}


def test_headers_raises_when_cron_secret_missing() -> None:
    original = queries._CRON_SECRET
    queries._CRON_SECRET = None
    with pytest.raises(RuntimeError, match="CRON_SECRET"):
        queries._headers()
    queries._CRON_SECRET = original


# ------------------------------
#  _get()
# ------------------------------

def test_get_calls_correct_url() -> None:
    with patch("queries.requests.get", return_value=_mock_response({})) as mock_get:
        queries._get("/some/path")
        called_url = mock_get.call_args.args[0]
        assert called_url == "https://example.convex.site/some/path"


def test_get_passes_headers() -> None:
    with patch("queries.requests.get", return_value=_mock_response({})) as mock_get:
        queries._get("/path")
        assert mock_get.call_args.kwargs["headers"] == {"x-cron-secret": "test-secret"}


def test_get_passes_params() -> None:
    with patch("queries.requests.get", return_value=_mock_response({})) as mock_get:
        queries._get("/path", {"key": "value"})
        assert mock_get.call_args.kwargs["params"] == {"key": "value"}


def test_get_returns_json() -> None:
    with patch("queries.requests.get", return_value=_mock_response({"foo": "bar"})):
        result = queries._get("/path")
        assert result == {"foo": "bar"}


def test_get_raises_on_http_error() -> None:
    resp = _mock_response(None, 500)
    resp.raise_for_status.side_effect = Exception("500 Server Error")
    with patch("queries.requests.get", return_value=resp):
        with pytest.raises(Exception, match="500"):
            queries._get("/path")


# ------------------------------
#  _post()
# ------------------------------

def test_post_calls_correct_url() -> None:
    with patch("queries.requests.post", return_value=_mock_response(None)) as mock_post:
        queries._post("/some/path", {})
        called_url = mock_post.call_args.args[0]
        assert called_url == "https://example.convex.site/some/path"


def test_post_passes_headers() -> None:
    with patch("queries.requests.post", return_value=_mock_response(None)) as mock_post:
        queries._post("/path", {})
        assert mock_post.call_args.kwargs["headers"] == {"x-cron-secret": "test-secret"}


def test_post_passes_body_as_json() -> None:
    body = {"userId": "u1", "recs": []}
    with patch("queries.requests.post", return_value=_mock_response(None)) as mock_post:
        queries._post("/path", body)
        assert mock_post.call_args.kwargs["json"] == body


def test_post_raises_on_http_error() -> None:
    resp = _mock_response(None, 400)
    resp.raise_for_status.side_effect = Exception("400 Bad Request")
    with patch("queries.requests.post", return_value=resp):
        with pytest.raises(Exception, match="400"):
            queries._post("/path", {})


# ------------------------------
#  user_exists()
# ------------------------------

def test_user_exists_returns_true_when_result_not_none() -> None:
    with patch("queries._get", return_value={"_id": "u1"}):
        assert queries.user_exists("u1") is True


def test_user_exists_returns_false_when_result_is_none() -> None:
    with patch("queries._get", return_value=None):
        assert queries.user_exists("u1") is False


def test_user_exists_calls_correct_path() -> None:
    with patch("queries._get", return_value={}) as mock_get:
        queries.user_exists("u42")
        mock_get.assert_called_once_with("/data-ml/user-exists", {"userId": "u42"})


# ------------------------------
#  get_all_user_ids()
# ------------------------------

def test_get_all_user_ids_returns_list() -> None:
    with patch("queries._get", return_value=["u1", "u2", "u3"]):
        result = queries.get_all_user_ids()
        assert result == ["u1", "u2", "u3"]


def test_get_all_user_ids_calls_correct_path() -> None:
    with patch("queries._get", return_value=[]) as mock_get:
        queries.get_all_user_ids()
        mock_get.assert_called_once_with("/data-ml/get-all-user-ids")


# ------------------------------
#  get_friend_ids()
# ------------------------------

def test_get_friend_ids_returns_list() -> None:
    with patch("queries._get", return_value=["u2", "u3"]):
        result = queries.get_friend_ids("u1")
        assert result == ["u2", "u3"]


def test_get_friend_ids_calls_correct_path_with_user_id() -> None:
    with patch("queries._get", return_value=[]) as mock_get:
        queries.get_friend_ids("u1")
        mock_get.assert_called_once_with("/data-ml/get-friend-ids", {"userId": "u1"})


def test_get_friend_ids_empty_list() -> None:
    with patch("queries._get", return_value=[]):
        result = queries.get_friend_ids("u1")
        assert result == []


# ------------------------------
#  query_all()
# ------------------------------

def test_query_all_returns_list_of_dicts() -> None:
    data = [{"_id": "1", "name": "tech"}, {"_id": "2", "name": "music"}]
    with patch("queries._get", return_value=data):
        result = queries.query_all("tags")
        assert result == data


def test_query_all_calls_correct_path_with_table_name() -> None:
    with patch("queries._get", return_value=[]) as mock_get:
        queries.query_all("events")
        mock_get.assert_called_once_with("/data-ml/query-all", {"table_name": "events"})


# ------------------------------
#  upsert_friend_recs()
# ------------------------------

def test_upsert_friend_recs_calls_correct_path() -> None:
    with patch("queries._post") as mock_post:
        queries.upsert_friend_recs("u1", [])
        mock_post.assert_called_once_with("/data-ml/upsert-friend-recs", {"userId": "u1", "recs": []})


def test_upsert_friend_recs_passes_recs() -> None:
    recs = [{"userId": "u2", "score": 0.9}]
    with patch("queries._post") as mock_post:
        queries.upsert_friend_recs("u1", recs)
        _, body = mock_post.call_args.args
        assert body["recs"] == recs


# ------------------------------
#  get_tag_info()
# ------------------------------

def test_get_tag_info_returns_correct_count() -> None:
    tags = [{"_id": "t1", "name": "tech"}, {"_id": "t2", "name": "music"}]
    with patch("queries._get", return_value=tags):
        count, _ = queries.get_tag_info()
        assert count == 2


def test_get_tag_info_builds_id_to_idx_map() -> None:
    tags = [{"_id": "t1", "name": "tech"}, {"_id": "t2", "name": "music"}]
    with patch("queries._get", return_value=tags):
        _, tag_map = queries.get_tag_info()
        assert tag_map == {"t1": 0, "t2": 1}


def test_get_tag_info_empty_tags() -> None:
    with patch("queries._get", return_value=[]):
        count, tag_map = queries.get_tag_info()
        assert count == 0
        assert tag_map == {}


def test_get_tag_info_calls_query_all_with_tags_table() -> None:
    with patch("queries._get", return_value=[]) as mock_get:
        queries.get_tag_info()
        mock_get.assert_called_once_with("/data-ml/query-all", {"table_name": "tags"})


# ------------------------------
#  get_user_tag_weights()
# ------------------------------

def test_get_user_tag_weights_returns_list() -> None:
    with patch("queries.requests.get", return_value=_mock_response([0.1, 0.2, 0.3])):
        result = queries.get_user_tag_weights(["u1"])
        assert result == [0.1, 0.2, 0.3]


def test_get_user_tag_weights_sends_multi_params() -> None:
    with patch("queries.requests.get", return_value=_mock_response([])) as mock_get:
        queries.get_user_tag_weights(["u1", "u2"])
        params = mock_get.call_args.kwargs["params"]
        assert params == [("userId", "u1"), ("userId", "u2")]


def test_get_user_tag_weights_raises_on_error() -> None:
    resp = _mock_response(None, 500)
    resp.raise_for_status.side_effect = Exception("500")
    with patch("queries.requests.get", return_value=resp):
        with pytest.raises(Exception):
            queries.get_user_tag_weights(["u1"])


# ------------------------------
#  get_by_event_id()
# ------------------------------

def test_get_by_event_id_returns_list() -> None:
    data = [{"eventId": "e1", "tagId": "t1"}]
    with patch("queries._get", return_value=data):
        result = queries.get_by_event_id("e1")
        assert result == data


def test_get_by_event_id_calls_correct_path() -> None:
    with patch("queries._get", return_value=[]) as mock_get:
        queries.get_by_event_id("e1")
        mock_get.assert_called_once_with("/data-ml/get-by-event-id", {"eventId": "e1"})


# ------------------------------
#  get_interactions_by_user_id()
# ------------------------------

def test_get_interactions_by_user_id_returns_list() -> None:
    data = [{"eventId": "e1", "status": "going"}]
    with patch("queries._get", return_value=data):
        result = queries.get_interactions_by_user_id("u1")
        assert result == data


def test_get_interactions_by_user_id_without_since_ms() -> None:
    with patch("queries._get", return_value=[]) as mock_get:
        queries.get_interactions_by_user_id("u1")
        mock_get.assert_called_once_with("/data-ml/get-interactions", {"userId": "u1"})


def test_get_interactions_by_user_id_with_since_ms() -> None:
    with patch("queries._get", return_value=[]) as mock_get:
        queries.get_interactions_by_user_id("u1", sinceMs=1700000000.0)
        mock_get.assert_called_once_with(
            "/data-ml/get-interactions", {"userId": "u1", "sinceMs": 1700000000.0}
        )


def test_get_interactions_by_user_id_omits_since_ms_when_none() -> None:
    with patch("queries._get", return_value=[]) as mock_get:
        queries.get_interactions_by_user_id("u1", sinceMs=None)
        _, params = mock_get.call_args.args
        assert "sinceMs" not in params


# ------------------------------
#  upsert_event_recs()
# ------------------------------

def test_upsert_event_recs_calls_correct_path() -> None:
    with patch("queries._post") as mock_post:
        queries.upsert_event_recs("u1", ["e1", "e2"])
        mock_post.assert_called_once_with(
            "/data-ml/upsert-event-recs", {"userId": "u1", "eventIds": ["e1", "e2"]}
        )


def test_upsert_event_recs_empty_list() -> None:
    with patch("queries._post") as mock_post:
        queries.upsert_event_recs("u1", [])
        _, body = mock_post.call_args.args
        assert body["eventIds"] == []


# ------------------------------
#  get_user_tag_weights_with_timestamp()
# ------------------------------

def test_get_user_tag_weights_with_timestamp_returns_dict() -> None:
    data = {"weights": [0.1, 0.2], "lastUpdatedAt": 1700000000.0}
    with patch("queries._get", return_value=data):
        result = queries.get_user_tag_weights_with_timestamp("u1", 3)
        assert result == data


def test_get_user_tag_weights_with_timestamp_calls_correct_path() -> None:
    with patch("queries._get", return_value={}) as mock_get:
        queries.get_user_tag_weights_with_timestamp("u1", 3)
        mock_get.assert_called_once_with(
            "/data-ml/get-user-tag-weights-timestamp", {"userId": "u1", "numTags": 3}
        )


# ------------------------------
#  upsert_user_tag_weights()
# ------------------------------

def test_upsert_user_tag_weights_calls_correct_path() -> None:
    with patch("queries._post") as mock_post:
        queries.upsert_user_tag_weights("u1", [0.1, 0.5, 0.4])
        mock_post.assert_called_once_with(
            "/data-ml/upsert-user-tag-weights", {"userId": "u1", "weights": [0.1, 0.5, 0.4]}
        )


def test_upsert_user_tag_weights_empty_weights() -> None:
    with patch("queries._post") as mock_post:
        queries.upsert_user_tag_weights("u1", [])
        _, body = mock_post.call_args.args
        assert body["weights"] == []
