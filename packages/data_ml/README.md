# @fomo/data-ml

This package contains functions that modify Convex datatables via ML algorithms.
Primarily, the directory is utilized for FOMO's recommendation engine for friends, events, and posts.

## Friend Recommendations (friendRecs.py)

Looks into three criteria for gauging friend recommendations for each user.:

1. User/User event attendance.
2. User/User accumulated event tags.
3. User/User accumulated post tags.

Utilizes memory-based collaborative filtering and cosine similarity to develop
a weighted average of all similiarties. The top 5 (subject to change) recommended
users are upserted into the friendRecs Convex table.

Pandas is currently utilized, and should be fine since there is not much
advanced computation. If we were to expand with neural networks/advanced matrix
operations on other recommendation types, we should look into NumPy vectorization.

## TODO: Event Recommendations

Matrix factorization and NumPy arrays can be utilized for faster performance.
@Manj0t is looking into it.

## TODO: Post Recommendations
