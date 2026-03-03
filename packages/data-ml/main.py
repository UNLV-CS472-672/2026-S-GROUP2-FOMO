import requests
import os
import numpy as np
import pandas as pd
from convex import ConvexClient
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity



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



# Similarity matrix for each user based on attended events.
def similarity_matrix_events() -> pd.DataFrame:

    # Convert into similarity matrix. (1 = Attended, 0 = Not Attended)
    merged_df = join_user_events()
    return pd.crosstab(merged_df["user"], merged_df["event"])



# Similarity matrix for each user based on attended event tags.
def similarity_matrix_eventTags() -> pd.DataFrame:

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




# Similarity matrix for each user based on all post tags.
def similarity_matrix_postTags() -> pd.DataFrame:

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
    merged_df = merged_df.rename(columns = {"name_x":"user_name", "name_y":"tag_name"})

    return pd.crosstab(merged_df["user_name"], merged_df["tag_name"])




def most_similar_users(df: pd.DataFrame, target_user: str, user_return_amt: int) -> list:

    if user_return_amt > len(df):
        raise Exception("ERROR: user_return_amt exceeds DataFrame size")
    
    try:
        # Compute similarity matrix and transform into dataframe.
        user_similarity_np = cosine_similarity(df)
        user_similarity_df = pd.DataFrame(user_similarity_np,     
                                          index   = df.index,
                                          columns = df.index )
        
        # Sort top 'user_return_amt' users and return new dataframe.
        similar_users = (
            user_similarity_df[target_user]
            .drop(target_user))
            # .sort_values(ascending=False)
            # .head(user_return_amt))
        similar_users = pd.DataFrame({"similarity_score": similar_users})
        return similar_users
    
    except:
        raise Exception("ERROR: User similarity matrix could not be made.")
    
    

def main():

    client.mutation("seed:seed")
    user = "Manjot"

    sim_scores_events_df = similarity_matrix_events()
    sim_scores_events_df = most_similar_users(sim_scores_events_df, user, 5)
    print(f"\n\nAttended Events for {user}:")
    print(sim_scores_events_df)

    sim_scores_event_tags_df = similarity_matrix_eventTags()
    sim_scores_event_tags_df = most_similar_users(sim_scores_event_tags_df, user, 5)
    print(f"\nRecs based on Event Tags for {user}:")
    print(sim_scores_event_tags_df)

    sim_scores_post_tags_df = similarity_matrix_postTags()
    sim_scores_post_tags_df = most_similar_users(sim_scores_post_tags_df, user, 3)
    print(f"\nPost Tags for {user}:")
    print(sim_scores_post_tags_df)




if __name__ == "__main__":

    load_dotenv()
    CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
    client = ConvexClient(CONVEX_CLOUD_URL)

    pd.set_option('display.max_rows', None)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.max_colwidth', 20)
    pd.set_option('display.width', 1000)

    main()

