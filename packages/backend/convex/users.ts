import { v } from 'convex/values';

import { Doc, Id } from './_generated/dataModel';
import { query, QueryCtx } from './_generated/server';
import {
  __backend_only_getAndAuthenticateCurrentConvexUser,
  __backend_only_guestOrAuthenticatedUser,
} from './auth';
import { getThreadedCommentsByPost } from './comments';

async function buildProfile(ctx: QueryCtx, user: Doc<'users'>) {
  const [posts, comments, userEventLinks, friendRecs] = await Promise.all([
    ctx.db
      .query('posts')
      .withIndex('by_author', (q) => q.eq('authorId', user._id))
      .collect(),
    ctx.db
      .query('comments')
      .withIndex('by_author', (q) => q.eq('authorId', user._id))
      .collect(),
    ctx.db
      .query('attendance')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect(),
    ctx.db
      .query('friendRecs')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .first(),
  ]);

  const events = (
    await Promise.all(userEventLinks.map((link: Doc<'attendance'>) => ctx.db.get(link.eventId)))
  ).filter((event: Doc<'events'> | null): event is Doc<'events'> => event !== null);

  const recommendedUsers = friendRecs
    ? (
        await Promise.all(
          friendRecs.recs.map(async (rec: { userId: string; score: number }) => {
            const recommendedUser = await ctx.db.get(rec.userId as Id<'users'>);

            if (!recommendedUser) {
              return null;
            }

            return {
              user: recommendedUser,
              score: rec.score,
            };
          })
        )
      ).filter(
        (
          recommendation: { user: Doc<'users'>; score: number } | null
        ): recommendation is { user: Doc<'users'>; score: number } => recommendation !== null
      )
    : [];

  return {
    user,
    posts: posts.sort((a: Doc<'posts'>, b: Doc<'posts'>) => b._creationTime - a._creationTime),
    comments: comments.sort(
      (a: Doc<'comments'>, b: Doc<'comments'>) => b._creationTime - a._creationTime
    ),
    events: events.sort((a: Doc<'events'>, b: Doc<'events'>) => a.startDate - b.startDate),
    stats: {
      postCount: posts.length,
      commentCount: comments.length,
      eventCount: events.length,
      recommendationCount: recommendedUsers.length,
    },
    recommendations: recommendedUsers,
  };
}

export const getCurrentProfileMinimal = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    return {
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    };
  },
});

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    return await buildProfile(ctx, user);
  },
});

export const getProfileById = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);

    if (!user) {
      return null;
    }

    return await buildProfile(ctx, user);
  },
});

export const getProfileByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', username))
      .first();

    if (!user) {
      return null;
    }

    return await buildProfile(ctx, user);
  },
});

function countComments(comments: Awaited<ReturnType<typeof getThreadedCommentsByPost>>): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}

async function serializeProfileFeedPost(
  ctx: QueryCtx,
  post: Doc<'posts'>,
  viewerId?: Doc<'users'>['_id']
) {
  const [author, comments, likes] = await Promise.all([
    ctx.db.get(post.authorId),
    getThreadedCommentsByPost(ctx, post._id),
    ctx.db
      .query('likes')
      .withIndex('by_postId', (q) => q.eq('postId', post._id))
      .collect(),
  ]);

  return {
    id: post._id,
    caption: post.caption ?? '',
    authorName: author?.displayName || author?.username || 'Unknown user',
    authorUsername: author?.username ?? '',
    authorAvatarUrl: author?.avatarUrl || '',
    likes: post.likeCount ?? likes.length,
    liked: viewerId ? likes.some((like) => like.userId === viewerId) : false,
    mediaIds: post.mediaIds ?? [],
    commentCount: countComments(comments),
    comments,
  };
}

export const getProfileFeed = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const [viewer, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);

    const posts = await ctx.db
      .query('posts')
      .withIndex('by_author', (q) => q.eq('authorId', userId))
      .order('desc')
      .collect();

    return await Promise.all(
      posts.map((post) => serializeProfileFeedPost(ctx, post, guestMode ? undefined : viewer._id))
    );
  },
});
