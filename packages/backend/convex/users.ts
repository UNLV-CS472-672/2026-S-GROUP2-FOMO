import { v } from 'convex/values';

import { Doc, Id } from './_generated/dataModel';
import { mutation, query, QueryCtx } from './_generated/server';
import {
  __backend_only_getAndAuthenticateCurrentConvexUser,
  __backend_only_guestOrAuthenticatedUser,
} from './auth';
import { getThreadedCommentsByPost } from './comments';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 24;
const BIO_MAX_LENGTH = 280;

function normalizeUsername(username: string): string {
  return username.trim();
}

function normalizeBio(bio: string): string {
  return bio.trim();
}

function validateUsername(username: string): void {
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    throw new Error(`Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters.`);
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    throw new Error('Username can only include letters, numbers, dots, underscores, and hyphens.');
  }
}

function validateBio(bio: string): void {
  if (bio.length > BIO_MAX_LENGTH) {
    throw new Error(`Description must be ${BIO_MAX_LENGTH} characters or less.`);
  }
}

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

  type AttendedEvent = Doc<'events'> | Doc<'externalEvents'>;

  const events = (
    await Promise.all(userEventLinks.map((link: Doc<'attendance'>) => ctx.db.get(link.eventId)))
  ).filter((event): event is AttendedEvent => event !== null);

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
    events: events.sort((a, b) => a.startDate - b.startDate),
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
  const [author, comments, likes, event] = await Promise.all([
    ctx.db.get(post.authorId),
    getThreadedCommentsByPost(ctx, post._id),
    ctx.db
      .query('likes')
      .withIndex('by_postId', (q) => q.eq('postId', post._id))
      .collect(),
    post.eventId ? ctx.db.get(post.eventId) : Promise.resolve(null),
  ]);

  return {
    id: post._id,
    caption: post.caption ?? '',
    creationTime: post._creationTime,
    authorName: author?.displayName || author?.username || 'Unknown user',
    authorUsername: author?.username ?? '',
    authorAvatarUrl: author?.avatarUrl || '',
    likes: post.likeCount ?? likes.length,
    liked: viewerId ? likes.some((like) => like.userId === viewerId) : false,
    mediaIds: post.mediaIds ?? [],
    eventId: post.eventId ?? null,
    eventName: event?.name ?? '',
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

export const updateAvatarUrl = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) {
      throw new Error('Could not resolve URL for uploaded avatar.');
    }
    await ctx.db.patch(user._id, { avatarUrl: url });
    return { avatarUrl: url };
  },
});

export const updateCurrentProfile = mutation({
  args: {
    username: v.string(),
    bio: v.string(),
  },
  handler: async (ctx, { username, bio }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);

    const nextUsername = normalizeUsername(username);
    const nextBio = normalizeBio(bio);

    validateUsername(nextUsername);
    validateBio(nextBio);

    if (nextUsername !== user.username) {
      const existingWithUsername = await ctx.db
        .query('users')
        .withIndex('by_username', (q) => q.eq('username', nextUsername))
        .unique();

      if (existingWithUsername && existingWithUsername._id !== user._id) {
        throw new Error('That username is already taken.');
      }
    }

    await ctx.db.patch(user._id, {
      username: nextUsername,
      displayName: nextUsername,
      bio: nextBio,
    });

    return {
      id: user._id,
      username: nextUsername,
      bio: nextBio,
    };
  },
});
