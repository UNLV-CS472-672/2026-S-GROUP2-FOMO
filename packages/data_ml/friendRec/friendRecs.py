import os
import pandas as pd
from typing import Optional
from convex import ConvexClient
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime

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

def log(message: str) -> None:
    now = datetime.now()
    pretty_time = f"[{now.strftime("%H:%M:%S %m/%d/%y")}]"
    print(f"{pretty_time} {message}")

# Checks if a userid exists in the "users" table.
def user_exists(user_id: str) -> bool:
    return get_client().query("data_ml/users:userExists", {"userId": user_id}) is not None

# Get all userIds that exist in "users"
def get_all_user_ids() -> list[str]:
    user_ids: list[str] = get_client().query("data_ml/users:getAllUserIds", {})
    return user_ids


# Get all accepted friend userIds for a user.
def get_friend_ids(user_id: str) -> list[str]:
    friend_ids: list[str] = get_client().query("data_ml/users:getFriendIds", {"userId": user_id})
    return friend_ids


# Combines "attendance" and "events" into a single dataframe.
def join_user_events() -> pd.DataFrame:

    # Store "attendance" and "events" into dataframes.
    attendance_data = get_client().query("data_ml/universal:queryAll", {"table_name": "attendance"})
    attendance_df = pd.json_normalize(attendance_data)
    attendance_df = attendance_df[["eventId", "userId"]]

    events_data = get_client().query("data_ml/universal:queryAll", {"table_name": "events"})
    events_df = pd.json_normalize(events_data)
    events_df = events_df[["_id", "name"]]

    # Join "attendance" and "events" table.
    merged_df = attendance_df.merge(events_df, left_on="eventId", right_on="_id")
    merged_df = merged_df.rename(columns={"userId": "user_id", "name": "event"})
    merged_df = merged_df[["user_id", "eventId", "event"]]
    
    return merged_df


# Raw data for all users and their attended events.
def raw_matrix_events() -> pd.DataFrame:
    # For each cell, 1 = attended and 0 = not attended.
    merged_df = join_user_events()
    return pd.crosstab(merged_df["user_id"], merged_df["event"])


# Raw data for all users and accumulated event tags.
def raw_matrix_eventTags() -> pd.DataFrame:
    # Join "attendance" and "events" dataframes.
    user_events_df = join_user_events()

    # Join "events" and "tags" dataframes.
    eventTags_json = get_client().query("data_ml/universal:queryAll", {"table_name": "eventTags"})
    eventTags_df = pd.json_normalize(eventTags_json)
    eventTags_df = eventTags_df[["eventId", "tagId"]]

    tags_json = get_client().query("data_ml/universal:queryAll", {"table_name": "tags"})
    tags_df = pd.json_normalize(tags_json)
    tags_df = tags_df[["_id", "name"]]

    event_tags_df = pd.merge(left = eventTags_df, right = tags_df, left_on = "tagId", right_on = "_id")
    event_tags_df = event_tags_df[["eventId", "tagId", "name"]]

    # Join newly made "user_events" and "event_tags" dataframes.
    merged_df = pd.merge(left = user_events_df, right = event_tags_df, left_on = "eventId", right_on = "eventId")
    merged_df = merged_df[["user_id", "name"]]
    merged_df = merged_df.rename(columns={"name": "tag"})

    # Convert into similarity matrix. (Rows = Users,  Columns = Tags,  Cell = # of times attended an event with tag).
    return pd.crosstab(merged_df["user_id"], merged_df["tag"])


# Raw data for users and accumulated post tags.
def raw_matrix_postTags() -> pd.DataFrame:

    # Join "users" and "posts" dataframes.
    users_json = get_client().query("data_ml/universal:queryAll", {"table_name": "users"})
    users_df = pd.json_normalize(users_json)
    users_df = users_df[["_id"]]

    posts_json = get_client().query("data_ml/universal:queryAll", {"table_name": "posts"})
    posts_df = pd.json_normalize(posts_json)
    posts_df = posts_df[["_id", "authorId"]]

    users_posts_df = pd.merge(left = users_df, right = posts_df, left_on = "_id", right_on = "authorId")
    users_posts_df = users_posts_df.rename(columns={"_id_y":"postId"})
    users_posts_df = users_posts_df.rename(columns={"_id_x":"user_id"})

    # Join "postTags" and "tags" dataframes
    postTags_json = get_client().query("data_ml/universal:queryAll", {"table_name": "postTags"})
    postTags_df = pd.json_normalize(postTags_json)
    postTags_df = postTags_df[["postId", "tagId"]]

    tags_json = get_client().query("data_ml/universal:queryAll", {"table_name": "tags"})
    tags_df = pd.json_normalize(tags_json)
    tags_df = tags_df[["_id", "name"]]

    post_tags_df = pd.merge(left = postTags_df, right = tags_df, left_on = "tagId", right_on = "_id")
    post_tags_df = post_tags_df[["postId", "name"]]

    # Join newly-made "user_posts" and "post_tags" dataframe.
    merged_df = pd.merge(left = users_posts_df, right = post_tags_df, left_on = "postId", right_on = "postId")
    merged_df = merged_df[["user_id", "name"]]
    merged_df = merged_df.rename(columns = {"name":"tag_name"})

    return pd.crosstab(merged_df["user_id"], merged_df["tag_name"])




# Convert raw matrices into similarity matrices via cosine similarity.
def similarity_score(df: pd.DataFrame, target_user_id: str) -> pd.DataFrame:
    
    if df.empty or target_user_id not in df.index:
        other_users = df.index.difference([target_user_id])
        return pd.DataFrame({"similarity_score": 0.0}, index=other_users)

    user_similarity_np = cosine_similarity(df)
    user_similarity_df = pd.DataFrame(user_similarity_np,     
                                      index   = df.index,
                                      columns = df.index)
    similar_users = user_similarity_df[target_user_id].drop(target_user_id)
    return pd.DataFrame({"similarity_score": similar_users})
        

# Factors in all three similarity matrices, weighted, for a final table.
def sim_scores_weighted(events: pd.DataFrame, event_tags: pd.DataFrame, post_tags:pd.DataFrame) -> pd.DataFrame:

    EVENTS_WEIGHT     =  0.80
    EVENT_TAGS_WEIGHT =  0.15
    POST_TAGS_WEIGHT  =  0.05

    return events.mul(EVENTS_WEIGHT) \
           .add(event_tags.mul(EVENT_TAGS_WEIGHT), fill_value = 0) \
           .add(post_tags.mul(POST_TAGS_WEIGHT), fill_value = 0) # Drops NaN values
    


# Send recommended friends to Convex server.
def upsert_friend_recs(sim_scores: pd.DataFrame, userId: str, rec_amt: int) -> None:
 
    # For user, sort similarity scores by highest.
    sim_scores = sim_scores.dropna(subset = ["similarity_score"])
    top_sim_scores = sim_scores.sort_values(by = 'similarity_score', ascending = False)  
    
    # Shuffle users with equal scores in place.
    # (Allows random friend requests for users with no events/posts).
    top_sim_scores = (
        top_sim_scores
        .assign(rank=lambda df: df['similarity_score'].rank(method='dense', ascending=False))
        .sample(frac=1) 
        .sort_values(by='rank') 
        .drop(columns='rank')
    )

    existing_friend_ids = set(get_friend_ids(userId))

    # Parse out any userIds that are already friends.
    top_sim_scores = [
        {"userId": friendId, "score": float(score)}
        for friendId, score in top_sim_scores["similarity_score"].items() 
        if friendId not in existing_friend_ids
    ]

    # If list is larger than rec_amt, truncate.
    # Total friend recs may be less than rec_amt, this is fine.
    top_sim_scores = top_sim_scores[:rec_amt]
    
    # Add row if user doesn't have any recommended friends, if they do, update names if values changed.
    get_client().mutation(
        "data_ml/friendRecs:upsert",
        {"userId": userId, "recs": top_sim_scores},
    )




# Generate friend recommendations for a single user.
def main_one_user(user: str, rec_amt: int, seed: bool) -> None:

    if seed:
        get_client().mutation("seed:seed")    
        
    if not user_exists(user):
        raise Exception(f"\"{user}\" cannot be found in users.")

    raw_events_df          = raw_matrix_events()
    raw_eventTags_df       = raw_matrix_eventTags()
    raw_postTags_df        = raw_matrix_postTags()
    
    simscores_events_df    = similarity_score(raw_events_df, user)
    simscores_eventTags_df = similarity_score(raw_eventTags_df, user)
    simscores_postTags_df  = similarity_score(raw_postTags_df, user)
    
    simscores_weighted = sim_scores_weighted(simscores_events_df, simscores_eventTags_df, simscores_postTags_df)
    
    upsert_friend_recs(simscores_weighted, user, rec_amt)


# Generate friend recommendations for all users.
def main_all_users(rec_amt: int, seed: bool) -> None:
    
    if seed:
        get_client().mutation("seed:seed")

    user_ids = get_all_user_ids()

    # Build all raw matrices once and only generate similarity scores for each user
    raw_events_df = raw_matrix_events()
    raw_eventTags_df = raw_matrix_eventTags()
    raw_postTags_df = raw_matrix_postTags()

    for user_id in user_ids:
        simscores_events_df = similarity_score(raw_events_df, user_id)
        simscores_eventTags_df = similarity_score(raw_eventTags_df, user_id)
        simscores_postTags_df = similarity_score(raw_postTags_df, user_id)

        simscores_weighted = sim_scores_weighted(simscores_events_df, simscores_eventTags_df, simscores_postTags_df)
        upsert_friend_recs(simscores_weighted, user_id, rec_amt)



USER     = "n17849zzm0xksq2x2wh0gpcqs584x1q6"  # By user_id, Claude
REC_AMT  = 5         # friendRecs schema only currently supports 5. 
SEED     = False      # Dictates if fake data needs to be populated into Convex.

if __name__ == "__main__":
    log("Updating friend recommendations...")
    main_all_users(REC_AMT, SEED)
    log("Friend recommendations updated.")

