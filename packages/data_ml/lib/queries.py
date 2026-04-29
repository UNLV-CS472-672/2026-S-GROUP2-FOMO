from convex import ConvexClient
from typing import Optional
from dotenv import load_dotenv
from typing import Any
import os

load_dotenv()
CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
_client: Optional[ConvexClient] = (
    ConvexClient(CONVEX_CLOUD_URL) if CONVEX_CLOUD_URL else None
)

def _get_convex_client() -> ConvexClient:
    if _client is None:
        raise RuntimeError("ConvexClient not initialized")
    return _client 

# Checks if a userid exists in the "users" table.
def user_exists(user_id: str) -> bool:
    result: Optional[Any] = _get_convex_client().query("data_ml/users:userExists", {"userId": user_id})
    return result is not None

# Get all userIds that exist in "users"
def get_all_user_ids() -> list[str]:
    user_ids: list[str] = _get_convex_client().query("data_ml/users:getAllUserIds", {})
    return user_ids

# Get all accepted friend userIds for a user.
def get_friend_ids(user_id: str) -> list[str]:
    friend_ids: list[str] = _get_convex_client().query("data_ml/friends:getFriendIds", {"userId": user_id})
    return friend_ids

# get full table from database.
def query_all(table_name: str) -> list[dict[str, Any]]:
    data: list[dict[str, Any]] = _get_convex_client().query("data_ml/universal:queryAll", {"table_name": table_name})
    return data

def seed() -> None:
    _get_convex_client().mutation("seed:seed")

def upsert_friend_recs(userId: str, top_sim_scores: list[dict[str, Any]]) -> None:
    _get_convex_client().mutation(
        "data_ml/friendRecs:upsert",
        {"userId": userId, "recs": top_sim_scores},
    )

def get_tag_info() -> tuple[int, dict[str, int]]:
    tags = _get_convex_client().query("data_ml/universal:queryAll", {"table_name": "tags"})
    tag_id_to_idx = {tag["_id"]: i for i, tag in enumerate(tags)}
    return len(tags), tag_id_to_idx

def get_user_tag_weights(users: list[str]) -> list[Optional[float]]:
    result: list[Optional[float]] = _get_convex_client().query("data_ml/eventRec:getUserTagWeights", {"userIDs": users})
    return result

def get_by_event_id(event_id: str) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = _get_convex_client().query("data_ml/eventRec:getByEventId", {"eventId": event_id})
    return result

def get_interactions_by_user_id(user_id: str, sinceMs: Optional[float] = None) -> list[dict[str, Any]]:
    x: list[dict[str, Any]]
    if sinceMs:
        x = _get_convex_client().query("data_ml/eventRec:getInteractionsByUserId", {"userId": user_id, "sinceMs": sinceMs})
    else:
        x = _get_convex_client().query("data_ml/eventRec:getInteractionsByUserId", {"userId": user_id})
    return x

def upsert_event_recs(user_id: str, event_ids: list[str]) -> None:
    _get_convex_client().mutation("data_ml/eventRec:upsertEventRecs", {"userId": user_id, "eventIds": event_ids})
    
def get_user_tag_weights_with_timestamp(user_id: str) -> dict[str, Any]:
    result: dict[str, Any] = _get_convex_client().query("data_ml/eventRec:getUserTagWeightsWithTimestamp", {"userId": user_id})
    print(result)
    return result

def upsert_user_tag_weights(user_id: str, weights: list[float]) -> None:
    _get_convex_client().mutation(
        "data_ml/eventRec:upsertUserTagWeights",
        {"userId": user_id, "weights": weights},
    )