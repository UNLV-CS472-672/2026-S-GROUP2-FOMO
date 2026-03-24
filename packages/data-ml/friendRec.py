import os
import pandas as pd
from convex import ConvexClient
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()
CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
client = ConvexClient(CONVEX_CLOUD_URL)


# Checks if a name can be found in the "users" datatable.
def user_exists(name: str) -> bool:
    return client.query("query:user", {"name": "seed|" + name.lower()}) is not None
    

# Combines "users" and "events" into a single dataframe.
def join_user_events() -> pd.DataFrame:

    # Store "users", "userToEvents", and "events" into dataframes.
    users_data = client.query("query:list", {"table_name": "users"})
    users_df = pd.json_normalize(users_data)
    users_df = users_df[["_id", "name"]]

    usersToEvents_data = client.query("query:list", {"table_name": "usersToEvents"})
    usersToEvents_df = pd.json_normalize(usersToEvents_data)
    usersToEvents_df = usersToEvents_df[["eventId", "userId"]]

    events_data = client.query("query:list", {"table_name": "events"})
    events_df = pd.json_normalize(events_data)
    events_df = events_df[["_id", "name"]]

    # Join "user" and "events" table. 
    merged_df = usersToEvents_df.merge(users_df, left_on = "userId", right_on = "_id")
    merged_df = merged_df[["name", "eventId"]]
    merged_df = merged_df.merge(events_df, left_on = "eventId", right_on = "_id")
    merged_df = merged_df.rename(columns={"name_x": "user", "name_y": "event"})
    
    return merged_df



# Raw data for all users and their attended events.
def raw_matrix_events() -> pd.DataFrame:

    # For each cell, 1 = attended and 0 = not attended.
    merged_df = join_user_events()
    return pd.crosstab(merged_df["user"], merged_df["event"])



# Raw data for all users and accumulated event tags.
def raw_matrix_eventTags() -> pd.DataFrame:

    # Join "users" and "events" dataframes.
    user_events_df = join_user_events()

    # Join "events" and "tags" dataframes.
    eventTags_json = client.query("query:list", {"table_name": "eventTags"})
    eventTags_df = pd.json_normalize(eventTags_json)
    eventTags_df = eventTags_df[["eventId", "tagId"]]

    tags_json = client.query("query:list", {"table_name": "tags"})
    tags_df = pd.json_normalize(tags_json)
    tags_df = tags_df[["_id", "name"]]

    event_tags_df = pd.merge(left = eventTags_df, right = tags_df, left_on = "tagId", right_on = "_id")
    event_tags_df = event_tags_df[["eventId", "tagId", "name"]]


    # Join newly made "user_events" and "event_tags" dataframes.
    merged_df = pd.merge(left = user_events_df, right = event_tags_df, left_on = "eventId", right_on = "eventId")
    merged_df = merged_df[["user", "name"]]
    merged_df = merged_df.rename(columns={"name": "tag"})

    # Convert into similarity matrix. (Rows = Users,  Columns = Tags,  Cell = # of times attended an event with tag).
    return pd.crosstab(merged_df["user"], merged_df["tag"])



# Rwa data for users and accumulated post tags.
def raw_matrix_postTags() -> pd.DataFrame:

    # Join "users" and "posts" dataframes.
    users_json = client.query("query:list", {"table_name": "users"})
    users_df = pd.json_normalize(users_json)
    users_df = users_df[["_id", "name"]]

    posts_json = client.query("query:list", {"table_name": "posts"})
    posts_df = pd.json_normalize(posts_json)
    posts_df = posts_df[["_id", "authorId"]]

    users_posts_df = pd.merge(left = users_df, right = posts_df, left_on = "_id", right_on = "authorId")
    users_posts_df = users_posts_df.rename(columns={"_id_y":"postId"})

    # Join "postTags" and "tags" dataframes
    postTags_json = client.query("query:list", {"table_name": "postTags"})
    postTags_df = pd.json_normalize(postTags_json)
    postTags_df = postTags_df[["postId", "tagId"]]

    tags_json = client.query("query:list", {"table_name": "tags"})
    tags_df = pd.json_normalize(tags_json)
    tags_df = tags_df[["_id", "name"]]

    post_tags_df = pd.merge(left = postTags_df, right = tags_df, left_on = "tagId", right_on = "_id")
    post_tags_df = post_tags_df[["postId", "name"]]

    # Join newly-made "user_posts" and "post_tags" dataframe.
    merged_df = pd.merge(left = users_posts_df, right = post_tags_df, left_on = "postId", right_on = "postId")
    merged_df = merged_df[["name_x", "name_y"]]
    merged_df = merged_df.rename(columns = {"name_x":"user", "name_y":"tag_name"})

    return pd.crosstab(merged_df["user"], merged_df["tag_name"])



# Convert raw matrices into similarity matrices via cosine similarity.
def similarity_score(df: pd.DataFrame, target_user: str) -> pd.DataFrame:

    try:
        user_similarity_np = cosine_similarity(df)
        user_similarity_df = pd.DataFrame(user_similarity_np,     
                                          index   = df.index,
                                          columns = df.index )
        # Extract column for target_user only.
        similar_users = (
            user_similarity_df[target_user]
            .drop(target_user))
        similar_users = pd.DataFrame({"similarity_score": similar_users})
        return similar_users
    
    except KeyError:
        raise KeyError(f"ERROR: '{target_user}' not found in DataFrame.")
    
    
    

# Factors in all three similarity matrices, weighted, for a final table.
def sim_scores_weighted(events: pd.DataFrame, event_tags: pd.DataFrame, post_tags:pd.DataFrame) -> pd.DataFrame:

    EVENTS_WEIGHT     =  0.80
    EVENT_TAGS_WEIGHT =  0.15
    POST_TAGS_WEIGHT  =  0.05

    return events * EVENTS_WEIGHT + event_tags * EVENT_TAGS_WEIGHT + post_tags * POST_TAGS_WEIGHT
    


# Send recommended friends to Convex server.
def upsert_friend_recs(sim_scores: pd.DataFrame, user: str, rec_amt: int):

    # Technically doesn't break if rec_amt exceeds, but being extra safe.
    if rec_amt > len(sim_scores):
        raise Exception(f"rec_amt ({rec_amt}) exceeds available users ({len(sim_scores)}).")
    

    # Sort top rec_amt recommended users, create list.
    top_sim_scores = sim_scores.sort_values(by = 'similarity_score', ascending = False).head(rec_amt)
    top_sim_scores = [
        {"userId": user, "score": float(score)}
        for user, score in top_sim_scores["similarity_score"].items()
    ]

    # Add row if user doesn't have any recommended friends, if they do, update names if values changed.
    client.mutation("friendRecs:upsert", {"user": user, 
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



USER     = "Manjot"  # Currently by userName, should be by userId soon.
REC_AMT  = 5         # friendRec schema only currently supports 5. 
SEED     = False     # Dictates if fake data needs to be populated into Convex.

if __name__ == "__main__":
    main(USER, REC_AMT, False)

