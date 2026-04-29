from convex import ConvexClient
from typing import Optional
from dotenv import load_dotenv
from typing import Any
import os

load_dotenv()
CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
client: Optional[ConvexClient] = (
    ConvexClient(CONVEX_CLOUD_URL) if CONVEX_CLOUD_URL else None
)

# Deploy ConvexClient from env.
def get_client() -> ConvexClient:
    if client is None:
        raise RuntimeError("ConvexClient not initialized")
    return client

# Checks if a userid exists in the "users" table.
def user_exists(user_id: str) -> bool:
    return get_client().query("data_ml/users:userExists", {"userId": user_id}) is not None

# Get all userIds that exist in "users"
def get_all_user_ids() -> list[str]:
    user_ids: list[str] = get_client().query("data_ml/users:getAllUserIds", {})
    return user_ids

# Get all accepted friend userIds for a user.
def get_friend_ids(user_id: str) -> list[str]:
    friend_ids: list[str] = get_client().query("data_ml/friends:getFriendIds", {"userId": user_id})
    return friend_ids

# get full table from database.
def query_all(table_name: str):
    data = get_client().query("data_ml/universal:queryAll", {"table_name": table_name})
    return data

def seed() -> None:
    get_client().mutation("seed:seed")

def upsertFriendRecs(userId: str, top_sim_scores: list[dict[str, Any]]):
    get_client().mutation(
        "data_ml/friendRecs:upsert",
        {"userId": userId, "recs": top_sim_scores},
    )
