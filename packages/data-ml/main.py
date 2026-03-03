import requests
import os
import numpy as np
import pandas as pd
from convex import ConvexClient
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()
CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
client = ConvexClient(CONVEX_CLOUD_URL)
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.max_colwidth', 20)
pd.set_option('display.width', 1000)



def similarity_matrix_events() -> pd.DataFrame:

    # Create projected dataframes for users, usersToEvents, and events.
    users_data = client.query("helpers:list", {"table_name": "users"})
    users_df = pd.json_normalize(users_data)
    users_df = users_df[["_id", "name"]]

    usersToEvents_data = client.query("helpers:list", {"table_name": "usersToEvents"})
    usersToEvents_df = pd.json_normalize(usersToEvents_data)
    usersToEvents_df = usersToEvents_df[["eventId", "userId"]]

    events_data = client.query("helpers:list", {"table_name": "events"})
    events_df = pd.json_normalize(events_data)
    events_df = events_df[["_id", "name"]]

    # Join tables, final table only all user names and event names they've been to.
    merged_df = usersToEvents_df.merge(users_df, left_on = "userId", right_on = "_id")[["name", "eventId"]]
    merged_df = merged_df.merge(events_df, left_on = "eventId", right_on = "_id")[["name_x", "name_y"]]
    merged_df = merged_df.rename(columns={"name_x": "user", "name_y": "event"})

    # Convert into similarity matrix. (1 = Attended, 0 = Not Attended)
    return pd.crosstab(merged_df["user"], merged_df["event"])



def similarity_matrix_event_tags() -> pd.DataFrame:

    # Create projected dataframes for users, usersToEvents, events, eventTags, and tags.
    users_json = client.query("helpers:list", {"table_name": "users"})
    users_df = pd.json_normalize(users_json)
    users_df = users_df[["_id", "name"]]

    usersToEvents_json = client.query("helpers:list", {"table_name": "usersToEvents"})
    usersToEvents_df = pd.json_normalize(usersToEvents_json)
    usersToEvents_df = usersToEvents_df[["eventId", "userId"]]

    events_json = client.query("helpers:list", {"table_name": "events"})
    events_df = pd.json_normalize(events_json)
    events_df = events_df[["_id", "name"]]

    eventTags_json = client.query("helpers:list", {"table_name": "eventTags"})
    eventTags_df = pd.json_normalize(eventTags_json)
    eventTags_df = eventTags_df[["eventId", "tagId"]]

    tags_json = client.query("helpers:list", {"table_name": "tags"})
    tags_df = pd.json_normalize(tags_json)
    tags_df = tags_df[["_id", "name"]]


    # Join tables, final table only all user names and event names they've been to.
    merged_df = usersToEvents_df.merge(users_df, left_on = "userId", right_on = "_id")[["name", "eventId"]]
    merged_df =  merged_df.merge(events_df, left_on = "eventId", right_on = "_id")
    merged_df = merged_df.rename(columns={"name_x": "user", "name_y": "event"})
    merged_df =  merged_df.merge(eventTags_df, left_on = "eventId", right_on = "eventId")[["user", "event", "tagId"]]
    merged_df =  merged_df.merge(tags_df, left_on = "tagId", right_on = "_id")[["user", "name"]]
    merged_df = merged_df.rename(columns={"name": "tag"})


    # Convert into similarity matrix.
    # Rows = Users,  Columns = Tags,  Cell = # of times attended an event with tag.
    return pd.crosstab(merged_df["user"], merged_df["tag"])


def similarity_matrix_post_tags() -> pd.DataFrame:

    # Create projected dataframes for users, posts, postTags, and tags.
    users_json = client.query("helpers:list", {"table_name": "users"})
    users_df = pd.json_normalize(users_json)
    users_df = users_df[["_id", "name"]]
    print(users_df)

    posts_json = client.query("helpers:list", {"table_name": "posts"})
    posts_df = pd.json_normalize(posts_json)
    posts_df = posts_df[["_id", "authorId"]]
    print(posts_df)

    postTags_json = client.query("helpers:list", {"table_name": "postTags"})
    postTags_df = pd.json_normalize(postTags_json)
    postTags_df = postTags_df[["postId", "tagId"]]
    print(postTags_df)

    tags_json = client.query("helpers:list", {"table_name": "tags"})
    tags_df = pd.json_normalize(tags_json)
    print(tags_df)

    print()
    print()
    print()


    merged_df = posts_df.merge(users_df, left_on = "authorId", right_on = "_id")[["_id_x", "name"]]
    print(merged_df)

    merged_df = merged_df.merge(postTags_df, left_on = "_id_x", right_on = "postId")[["name", "tagId"]]
    print(merged_df)

    merged_df = merged_df.merge(tags_df, left_on = "tagId", right_on = "_id")[["name_x", "name_y"]]
    print(merged_df)

    print(pd.crosstab(merged_df["name_x"], merged_df["name_y"]))

    return pd.crosstab(merged_df["name_x"], merged_df["name_y"])




def most_similar_users(df: pd.DataFrame, target_user: str, user_return_amt: int) -> list:

    if user_return_amt > len(df):
        raise Exception("ERROR: user_return_amt exceeds DataFrame size")
    
    try:
        # Compute similarity matrix and transform into dataframe.
        user_similarity_np = cosine_similarity(df)
        user_similarity_df = pd.DataFrame(user_similarity_np,     
                                          index   = df.index,
                                          columns = df.index )
        
        # Sort top-simliar users and return new dataframe with such.
        similar_users = (
            user_similarity_df[target_user]
            .drop(target_user)
            .sort_values(ascending=False)
            .head(user_return_amt))
        similar_users = pd.DataFrame({"similarity_score": similar_users})
        return similar_users
    
    except:
        raise Exception("ERROR: User similarity matrix could not be made.")
    
    

def main():

    client.mutation("seed:seed")
    user = "Reece"

    similarity_df = similarity_matrix_events()
    users = most_similar_users(similarity_df, user, 5)
    print(f"Attended Events for {user}:")
    # print(users)

    tag = similarity_matrix_event_tags()
    tag = most_similar_users(tag, user, 5)
    print(f"\nEvent Tags for {user}:")
    # print(tag)

    posts = similarity_matrix_post_tags()
    posts = most_similar_users(posts, user, 3)
    print(f"\nPost Tags for {user}:")
    print(posts)






if __name__ == "__main__":
    main()

