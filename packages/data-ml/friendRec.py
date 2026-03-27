import os
import pandas as pd

from convex import ConvexClient
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()
CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
client = ConvexClient(CONVEX_CLOUD_URL)


# Checks if a userid exists in the "users" table.
def user_exists(user_id: str) -> bool:
    return client.query("data_ml/users:userExists", {"userId": user_id}) is not None
    

# Combines "usersToEvents" and "events" into a single dataframe.
def join_user_events() -> pd.DataFrame:

    # Store "usersToEvents" and "events" into dataframes.
    usersToEvents_data = client.query("data_ml/universal:queryAll", {"table_name": "usersToEvents"})
    usersToEvents_df = pd.json_normalize(usersToEvents_data)
    usersToEvents_df = usersToEvents_df[["eventId", "userId"]]

    events_data = client.query("data_ml/universal:queryAll", {"table_name": "events"})
    events_df = pd.json_normalize(events_data)
    events_df = events_df[["_id", "name"]]

    # Join "usersToEvents" and "events" table.
    merged_df = usersToEvents_df.merge(events_df, left_on="eventId", right_on="_id")
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

    # Join "usersToEvents" and "events" dataframes.
    user_events_df = join_user_events()

    # Join "events" and "tags" dataframes.
    eventTags_json = client.query("data_ml/universal:queryAll", {"table_name": "eventTags"})
    eventTags_df = pd.json_normalize(eventTags_json)
    eventTags_df = eventTags_df[["eventId", "tagId"]]

    tags_json = client.query("data_ml/universal:queryAll", {"table_name": "tags"})
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



# Rwa data for users and accumulated post tags.
def raw_matrix_postTags() -> pd.DataFrame:

    # Join "users" and "posts" dataframes.
    users_json = client.query("data_ml/universal:queryAll", {"table_name": "users"})
    users_df = pd.json_normalize(users_json)
    users_df = users_df[["_id"]]

    posts_json = client.query("data_ml/universal:queryAll", {"table_name": "posts"})
    posts_df = pd.json_normalize(posts_json)
    posts_df = posts_df[["_id", "authorId"]]

    users_posts_df = pd.merge(left = users_df, right = posts_df, left_on = "_id", right_on = "authorId")
    users_posts_df = users_posts_df.rename(columns={"_id_y":"postId"})
    users_posts_df = users_posts_df.rename(columns={"_id_x": "user_id"})

    # Join "postTags" and "tags" dataframes
    postTags_json = client.query("data_ml/universal:queryAll", {"table_name": "postTags"})
    postTags_df = pd.json_normalize(postTags_json)
    postTags_df = postTags_df[["postId", "tagId"]]

    tags_json = client.query("data_ml/universal:queryAll", {"table_name": "tags"})
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

    try:
        user_similarity_np = cosine_similarity(df)
        user_similarity_df = pd.DataFrame(user_similarity_np,     
                                          index   = df.index,
                                          columns = df.index )
        # Extract column for target_user only.
        similar_users = (
            user_similarity_df[target_user_id]
            .drop(target_user_id))
        similar_users = pd.DataFrame({"similarity_score": similar_users})
        return similar_users
    
    except KeyError:
        raise KeyError(f"ERROR: '{target_user_id}' not found in DataFrame.")
    
    
    

# Factors in all three similarity matrices, weighted, for a final table.
def sim_scores_weighted(events: pd.DataFrame, event_tags: pd.DataFrame, post_tags:pd.DataFrame) -> pd.DataFrame:

    EVENTS_WEIGHT     =  0.80
    EVENT_TAGS_WEIGHT =  0.15
    POST_TAGS_WEIGHT  =  0.05

    return events.mul(EVENTS_WEIGHT) \
           .add(event_tags.mul(EVENT_TAGS_WEIGHT), fill_value = 0) \
           .add(post_tags.mul(POST_TAGS_WEIGHT), fill_value = 0) # Drops NaN values
    


# Send recommended friends to Convex server.
def upsert_friend_recs(sim_scores: pd.DataFrame, userId: str, rec_amt: int):

    # Technically doesn't break if rec_amt exceeds, but being extra safe.
    if rec_amt > len(sim_scores):
        raise Exception(f"rec_amt ({rec_amt}) exceeds available users ({len(sim_scores)}).")
    
    # For user, sort similarity scores by highest.
    sim_scores = sim_scores.dropna(subset = ["similarity_score"])
    top_sim_scores = sim_scores.sort_values(by = 'similarity_score', ascending = False)  

    # Parse out any userIds that are already friends.
    top_sim_scores = [
        {"userId": friendId, "score": float(score)}
        for friendId, score in top_sim_scores["similarity_score"].items() 
        if client.query("data_ml/friends:friendExists", {"userAId": userId, "userBId": friendId}) is None
    ]

    # If list is larger than rec_amt, truncate.
    # Total friend recs may be less than rec_amt, this is fine.
    top_sim_scores = top_sim_scores[:rec_amt]
    
    # Add row if user doesn't have any recommended friends, if they do, update names if values changed.
    client.mutation("data_ml/friendRecs:upsert", {"userId": userId,
                                          "recs": top_sim_scores
                                          })  



def main(user: str, rec_amt: int, seed: bool):
    
    if seed:
        client.mutation("seed:seed")    
        
    if not user_exists(user):
        raise Exception(f"\"{user}\" cannot be found in users.")

    raw_events_df          = raw_matrix_events()
    simscores_events_df    = similarity_score(raw_events_df, user)
    # print(f"\nRecs based on Attended Events for {user}: {simscores_events_df}")

    raw_eventTags_df       = raw_matrix_eventTags()
    simscores_eventTags_df = similarity_score(raw_eventTags_df, user)
    # print(f"\nRecs based on Event Tags for {user}: {simscores_eventTags_df}")

    raw_postTags_df        = raw_matrix_postTags()
    simscores_postTags_df  = similarity_score(raw_postTags_df, user)
    # print(f"\nRecs based on Post Tags for {user}: {simscores_postTags_df}")

    simscores_weighted = sim_scores_weighted(simscores_events_df, simscores_eventTags_df, simscores_postTags_df)
    upsert_friend_recs(simscores_weighted, user, rec_amt)


USER     = "n170a6cc33hgr22xbxsmnh1txd82713v"  # By user_id.
REC_AMT  = 5         # friendRec schema only currently supports 5. 
SEED     = False     # Dictates if fake data needs to be populated into Convex.

if __name__ == "__main__":
    main(USER, REC_AMT, SEED)

