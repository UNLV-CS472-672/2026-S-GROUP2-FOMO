import requests
import os
import numpy as np
import pandas as pd
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)

from convex import ConvexClient
from dotenv import load_dotenv
load_dotenv()
CONVEX_CLOUD_URL = os.getenv("CONVEX_CLOUD_URL")
client = ConvexClient(CONVEX_CLOUD_URL)

from sklearn.metrics.pairwise import cosine_similarity


def convex_clean(convex_data: dict) -> pd.DataFrame:
    try:
        # Extracts only numerical values used for collab. filtering.
        df = pd.json_normalize(convex_data)
        df = df.drop(columns = ['_id','_creationTime'])
        return df
    except:
        raise Exception("ERROR: Convex data couldn't be cleaned.")


def most_similar_users(df: pd.DataFrame, target_user: str, user_return_amt: int) -> list:
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

    # Deploy test/fake data tables.
    client.mutation("seed:seed")

    convex_data = client.query("helpers:list", {"table_name": "fake_user_attendance_100"})
    df = convex_clean(convex_data)
    df = df.set_index('user')
    print(most_similar_users(df, "user10", 5))

    convex_data = client.query("helpers:list", {"table_name": "fake_user_event_tags_vibe_100"})
    df2 = convex_clean(convex_data)
    df2 = df2.set_index('user')
    print(most_similar_users(df2, "user10", 7))


if __name__ == "__main__":
    main()

