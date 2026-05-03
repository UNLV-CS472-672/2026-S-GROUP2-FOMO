import os
import requests
from typing import Optional, Any
from dotenv import load_dotenv

load_dotenv()
_BASE_URL = os.getenv("CONVEX_SITE_URL")
_CRON_SECRET = os.getenv("CRON_SECRET")

def _get_base_url() -> str:
    if not _BASE_URL:
        raise RuntimeError("CONVEX_SITE_URL environment variable not set")
    return _BASE_URL.rstrip("/")

def _headers() -> dict[str, str]:
    if not _CRON_SECRET:
        raise RuntimeError("CRON_SECRET environment variable not set")
    return {"x-cron-secret": _CRON_SECRET}


def _get(path: str, params: Optional[dict[str, Any]] = None) -> Any:
    resp = requests.get(f"{_get_base_url()}{path}", headers=_headers(), params=params)
    resp.raise_for_status()
    return resp.json()


def _post(path: str, body: dict[str, Any]) -> None:
    resp = requests.post(f"{_get_base_url()}{path}", headers=_headers(), json=body)
    resp.raise_for_status()


def user_exists(user_id: str) -> bool:
    result: Any = _get("/data-ml/user-exists", {"userId": user_id})
    return result is not None


def get_all_user_ids() -> list[str]:
    return _get("/data-ml/get-all-user-ids")  # type: ignore[no-any-return]


def get_friend_ids(user_id: str) -> list[str]:
    return _get("/data-ml/get-friend-ids", {"userId": user_id})  # type: ignore[no-any-return]


def query_all(table_name: str) -> list[dict[str, Any]]:
    return _get("/data-ml/query-all", {"table_name": table_name})  # type: ignore[no-any-return]

def query_active(num_tags: int | None) -> list[dict[str, Any]]:
    if num_tags is not None:
        return _get("/data-ml/get-users-with-recent-activity", {"numTags": num_tags}) # type: ignore[no-any-return]
    return _get("/data-ml/get-users-with-recent-activity") # type: ignore[no-any-return]

def upsert_friend_recs(userId: str, top_sim_scores: list[dict[str, Any]]) -> None:
    _post("/data-ml/upsert-friend-recs", {"userId": userId, "recs": top_sim_scores})


def get_tag_info() -> tuple[int, dict[str, int]]:
    tags: list[dict[str, Any]] = _get("/data-ml/query-all", {"table_name": "tags"})
    tag_id_to_idx = {tag["_id"]: i for i, tag in enumerate(tags)}
    return len(tags), tag_id_to_idx


def get_user_tag_weights(users: list[str]) -> list[Optional[float]]:
    resp = requests.get(
        f"{_get_base_url()}/data-ml/get-user-tag-weights",
        headers=_headers(),
        params=[("userId", uid) for uid in users],
    )
    resp.raise_for_status()
    return resp.json()  # type: ignore[no-any-return]


def get_by_event_id(event_id: str) -> list[dict[str, Any]]:
    return get_by_event_ids([event_id])


def get_by_event_ids(event_ids: list[str]) -> list[dict[str, Any]]:
    resp = requests.get(
        f"{_get_base_url()}/data-ml/get-by-event-ids",
        headers=_headers(),
        params=[("eventId", event_id) for event_id in event_ids],
    )
    resp.raise_for_status()
    return resp.json()  # type: ignore[no-any-return]


def get_interactions_by_user_id(
    user_id: str, sinceMs: Optional[float] = None
) -> list[dict[str, Any]]:
    row: dict[str, Any] = {"userId": user_id}
    if sinceMs is not None:
        row["sinceMs"] = sinceMs
    return get_interactions_by_users([row])


def get_interactions_by_users(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    resp = requests.post(
        f"{_get_base_url()}/data-ml/get-interactions-by-users",
        headers=_headers(),
        json={"rows": rows},
    )
    resp.raise_for_status()
    return resp.json()  # type: ignore[no-any-return]


def get_interactions_by_user_ids(user_ids: list[str]) -> list[dict[str, Any]]:
    resp = requests.get(
        f"{_get_base_url()}/data-ml/get-interactions-by-user-ids",
        headers=_headers(),
        params=[("userId", user_id) for user_id in user_ids],
    )
    resp.raise_for_status()
    return resp.json()  # type: ignore[no-any-return]


def upsert_event_recs(user_id: str, event_ids: list[str]) -> None:
    upsert_event_recs_batch([{"userId": user_id, "eventIds": event_ids}])


def upsert_event_recs_batch(rows: list[dict[str, Any]]) -> None:
    _post("/data-ml/upsert-event-recs-batch", {"rows": rows})


def get_user_tag_weights_with_timestamp(user_id: str, num_tags: int) -> dict[str, Any]:
    results = get_user_tag_weights_with_timestamps([user_id], num_tags)
    if results:
        result = dict(results[0])
        result.pop("userId", None)
        return result
    return {"weights": [0] * (num_tags * 3), "updatedAt": 0, "lastDecayedAt": 0,}


def get_user_tag_weights_with_timestamps(
    user_ids: list[str], num_tags: int
) -> list[dict[str, Any]]:
    resp = requests.get(
        f"{_get_base_url()}/data-ml/get-user-tag-weights-timestamps",
        headers=_headers(),
        params=[("userId", user_id) for user_id in user_ids] + [("numTags", num_tags)],
    )
    resp.raise_for_status()
    return resp.json()  # type: ignore[no-any-return]


def upsert_user_tag_weights(user_id: str, weights: list[float]) -> None:
    upsert_user_tag_weights_batch([{"userId": user_id, "weights": weights}])


def upsert_user_tag_weights_batch(rows: list[dict[str, Any]]) -> None:
    _post("/data-ml/upsert-user-tag-weights-batch", {"rows": rows})

def get_preferred_tags_by_user_id(user_ids: list[str]) -> list[str]:
    resp = requests.get(
        f"{_get_base_url()}/data-ml/get-preferred-tags-by-user-id",
        headers=_headers(),
        params=[("userId", uid) for uid in user_ids],
    )
    resp.raise_for_status()
    return resp.json()  # type: ignore[no-any-return]

def get_all_events_after_now() -> list[dict[str, Any]]:
    return _get("/data-ml/get-all-events-after-now") # type: ignore[no-any-return]

def get_users_needing_event_rec() -> list[str]:
    return _get("/data-ml/get-users-needing-event-rec")  # type: ignore[no-any-return]

def get_users_needing_friend_rec() -> list[str]:
    return _get("/data-ml/get-users-needing-friend-rec")  # type: ignore[no-any-return]
