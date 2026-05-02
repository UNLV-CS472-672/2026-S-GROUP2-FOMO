import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from lib import queries, log


# Build a symmetric lookup of users who should never be recommended to each other.
def get_blocked_user_lookup() -> dict[str, set[str]]:
    blocked_rows = queries.query_all("blockedUsers")
    blocked_lookup: dict[str, set[str]] = {}

    for row in blocked_rows:
        blocker_id = row["blockerId"]
        blocked_user_id = row["blockedUserId"]

        blocked_lookup.setdefault(blocker_id, set()).add(blocked_user_id)
        blocked_lookup.setdefault(blocked_user_id, set()).add(blocker_id)

    return blocked_lookup


# Combines "attendance" and "events" into a single dataframe.
def join_user_events() -> pd.DataFrame:

    # Store "attendance" and "events" into dataframes.
    attendance_data = queries.query_all("attendance")
    attendance_df = pd.json_normalize(attendance_data)
    attendance_df = attendance_df[["eventId", "userId"]]

    events_data = queries.query_all("events")
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
    eventTags_json = queries.query_all("eventTags")
    eventTags_df = pd.json_normalize(eventTags_json)
    eventTags_df = eventTags_df[["eventId", "tagId"]]

    tags_json = queries.query_all("tags")
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
    users_json = queries.query_all("users")
    users_df = pd.json_normalize(users_json)
    users_df = users_df[["_id"]]

    posts_json = queries.query_all("posts")
    posts_df = pd.json_normalize(posts_json)
    posts_df = posts_df[["_id", "authorId"]]

    users_posts_df = pd.merge(left = users_df, right = posts_df, left_on = "_id", right_on = "authorId")
    users_posts_df = users_posts_df.rename(columns={"_id_y":"postId"})
    users_posts_df = users_posts_df.rename(columns={"_id_x":"user_id"})

    # Join "postTags" and "tags" dataframes
    postTags_json = queries.query_all("postTags")
    postTags_df = pd.json_normalize(postTags_json)
    postTags_df = postTags_df[["postId", "tagId"]]

    tags_json = queries.query_all("tags")
    tags_df = pd.json_normalize(tags_json)
    tags_df = tags_df[["_id", "name"]]

    post_tags_df = pd.merge(left = postTags_df, right = tags_df, left_on = "tagId", right_on = "_id")
    post_tags_df = post_tags_df[["postId", "name"]]

    # Join newly-made "user_posts" and "post_tags" dataframe.
    merged_df = pd.merge(left = users_posts_df, right = post_tags_df, left_on = "postId", right_on = "postId")
    merged_df = merged_df[["user_id", "name"]]
    merged_df = merged_df.rename(columns = {"name":"tag_name"})

    return pd.crosstab(merged_df["user_id"], merged_df["tag_name"])


# Convert similarity matrix from raw matrices via cosine similarity
def build_similarity_matrix(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()
    user_similarity_np = cosine_similarity(df)
    return pd.DataFrame(user_similarity_np, index=df.index, columns=df.index)

# Get user scores from the similarity matrix
def get_user_scores(sim_matrix: pd.DataFrame, target_user_id: str) -> pd.DataFrame:
    # Handle users with no data or empty matrices
    if sim_matrix.empty or target_user_id not in sim_matrix.index:
        other_users = sim_matrix.index.difference([target_user_id])
        return pd.DataFrame({"similarity_score": 0.0}, index=other_users)

    # Get the specific user's column and drop their own score
    similar_users = sim_matrix[target_user_id].drop(target_user_id)
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
def upsert_friend_recs(
    sim_scores: pd.DataFrame,
    userId: str,
    rec_amt: int,
    blocked_lookup: dict[str, set[str]] | None = None,
) -> None:

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

    existing_friend_ids = set(queries.get_friend_ids(userId))
    blocked_user_ids = blocked_lookup.get(userId, set()) if blocked_lookup else set()
    excluded_user_ids = existing_friend_ids | blocked_user_ids

    # Parse out any userIds that are already friends or blocked in either direction.
    top_sim_scores = [
        {"userId": friendId, "score": float(score)}
        for friendId, score in top_sim_scores["similarity_score"].items()
        if friendId not in excluded_user_ids
    ]

    # If list is larger than rec_amt, truncate.
    # Total friend recs may be less than rec_amt, this is fine.
    top_sim_scores = top_sim_scores[:rec_amt]

    # Add row if user doesn't have any recommended friends, if they do, update names if values changed.
    queries.upsert_friend_recs(userId, top_sim_scores)




# Generate friend recommendations for a single user.
def main_one_user(user: str, rec_amt: int) -> None:
    if not queries.user_exists(user):
        raise Exception(f"\"{user}\" cannot be found in users.")

    blocked_lookup = get_blocked_user_lookup()

    raw_events_df          = raw_matrix_events()
    raw_eventTags_df       = raw_matrix_eventTags()
    raw_postTags_df        = raw_matrix_postTags()

    matrix_events = build_similarity_matrix(raw_events_df)
    matrix_eventTags = build_similarity_matrix(raw_eventTags_df)
    matrix_postTags = build_similarity_matrix(raw_postTags_df)

    simscores_events_df = get_user_scores(matrix_events, user)
    simscores_eventTags_df = get_user_scores(matrix_eventTags, user)
    simscores_postTags_df = get_user_scores(matrix_postTags, user)

    simscores_weighted = sim_scores_weighted(simscores_events_df, simscores_eventTags_df, simscores_postTags_df)

    upsert_friend_recs(simscores_weighted, user, rec_amt, blocked_lookup)


# Generate friend recommendations for all users.
def main_all_users(rec_amt: int) -> None:
    user_ids = queries.get_all_user_ids()
    blocked_lookup = get_blocked_user_lookup()

    # Build all raw matrices once and only generate similarity scores for each user
    raw_events_df = raw_matrix_events()
    raw_eventTags_df = raw_matrix_eventTags()
    raw_postTags_df = raw_matrix_postTags()

    matrix_events = build_similarity_matrix(raw_events_df)
    matrix_eventTags = build_similarity_matrix(raw_eventTags_df)
    matrix_postTags = build_similarity_matrix(raw_postTags_df)

    for user_id in user_ids:
        simscores_events_df = get_user_scores(matrix_events, user_id)
        simscores_eventTags_df = get_user_scores(matrix_eventTags, user_id)
        simscores_postTags_df = get_user_scores(matrix_postTags, user_id)

        simscores_weighted = sim_scores_weighted(simscores_events_df, simscores_eventTags_df, simscores_postTags_df)
        upsert_friend_recs(simscores_weighted, user_id, rec_amt, blocked_lookup)



USER     = "n17849zzm0xksq2x2wh0gpcqs584x1q6"  # By user_id, Claude
REC_AMT  = 5         # friendRecs schema only currently supports 5.

if __name__ == "__main__":
    log("Updating friend recommendations...")
    main_all_users(REC_AMT)
    log("Friend recommendations updated.")

