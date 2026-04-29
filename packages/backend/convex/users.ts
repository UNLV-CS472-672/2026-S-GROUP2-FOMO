import type { UserJSON } from '@clerk/backend';
import { v, type Validator } from 'convex/values';

import { Doc, Id } from './_generated/dataModel';
import { internalMutation, mutation, query, QueryCtx } from './_generated/server';
import {
  __backend_only_getAndAuthenticateCurrentConvexUser,
  __backend_only_guestOrAuthenticatedUser,
} from './auth';
import { getThreadedCommentsByPost } from './comments';

const BIO_MAX_LENGTH = 280;

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

function sanitizeUsername(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '_');
  return normalized.length > 0 ? normalized : 'user';
}

function usernameFromPrimaryEmail(data: UserJSON): string | null {
  const primaryEmail = data.email_addresses?.find(
    (email) => email.id === data.primary_email_address_id
  );
  const emailValue = primaryEmail?.email_address?.trim();
  if (!emailValue) {
    return null;
  }

  const localPart = emailValue.split('@')[0];
  if (!localPart) {
    return null;
  }
  return sanitizeUsername(localPart);
}

function getUsername(data: UserJSON): string {
  const clerkUsername = data.username?.trim();
  if (clerkUsername && clerkUsername.length > 0) {
    return sanitizeUsername(clerkUsername);
  }

  const emailUsername = usernameFromPrimaryEmail(data);
  if (emailUsername) {
    return emailUsername;
  }

  // Final fallback keeps a stable value, but avoids shipping raw `user_...` ids.
  return `user_${data.id.slice(-8).toLowerCase()}`;
}

function getDisplayName(data: UserJSON): string {
  const first = data.first_name?.trim() ?? '';
  const last = data.last_name?.trim() ?? '';
  const fullName = `${first} ${last}`.trim();
  if (fullName.length > 0) {
    return fullName;
  }
  return data.username ?? data.id;
}

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    // Webhook source of truth for identity fields mirrored into Convex users.
    const userAttributes = {
      clerkId: data.id,
      username: getUsername(data),
      displayName: getDisplayName(data),
      avatarUrl: data.image_url ?? '',
    };

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', data.id))
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

export const updateCurrentProfile = mutation({
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
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkUserId))
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
