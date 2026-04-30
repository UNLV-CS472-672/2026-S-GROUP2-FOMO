import type { UserJSON } from '@clerk/backend';
import { env } from '@fomo/env/backend';
import { v, type Validator } from 'convex/values';

import { Doc, Id } from './_generated/dataModel';
import { internalMutation, mutation, query, QueryCtx } from './_generated/server';
import {
  __backend_only_getAndAuthenticateCurrentConvexUser,
  __backend_only_guestOrAuthenticatedUser,
} from './auth';
import { getThreadedCommentsByPost } from './comments';

export const BIO_MAX_LENGTH = 250;

function normalizeBio(bio: string): string {
  return bio.trim();
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

function getDisplayName(data: UserJSON): string {
  return data.username!;
}

function clerkIdFromClerkUserId(clerkUserId: string): string {
  // NOTE :: match the id as ctx.auth.getIdentity returns
  return `${env.CLERK_JWT_ISSUER_DOMAIN}|${clerkUserId}`;
}

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const normalizedClerkId = clerkIdFromClerkUserId(data.id);

    // Webhook source of truth for identity fields mirrored into Convex users.
    const userAttributes = {
      clerkId: normalizedClerkId,
      username: data.username!,
      displayName: getDisplayName(data),
      avatarUrl: data.image_url ?? '',
    };

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', normalizedClerkId))
      .unique();

    if (existing === null) {
      await ctx.db.insert('users', {
        ...userAttributes,
        bio: '',
      });
      return;
    }

    await ctx.db.patch(existing._id, userAttributes);
  },
});

export const updateBio = mutation({
  args: { bio: v.string() },
  handler: async (ctx, { bio }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const nextBio = normalizeBio(bio);
    validateBio(nextBio);

    // Username/displayName/avatarUrl are Clerk-owned; webhook updates those fields.
    await ctx.db.patch(user._id, { bio: nextBio });

    return {
      id: user._id,
      username: user.username,
      bio: nextBio,
    };
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const normalizedClerkId = clerkIdFromClerkUserId(clerkUserId);
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', normalizedClerkId))
      .unique();

    if (existing !== null) {
      await ctx.db.delete(existing._id);
    }
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
