import type { UserIdentity } from 'convex/server';
import { v } from 'convex/values';

import { Doc, Id } from './_generated/dataModel';
import { mutation, MutationCtx, query, QueryCtx } from './_generated/server';

type ClerkIdentity = UserIdentity & { username?: string };

function clerkIdFromIdentity(identity: UserIdentity): string {
  const clerkId = identity.clerkId;
  if (typeof clerkId === 'string' && clerkId.length > 0) {
    return clerkId;
  }
  return identity.tokenIdentifier;
}

async function getClerkIdentity(ctx: QueryCtx): Promise<ClerkIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('No Clerk identity found');
  }

  return identity as ClerkIdentity;
}

/**
 * Returns the current user's Clerk id (`identity.clerkId`, or Convex `tokenIdentifier` if absent)
 * or throws if the client is not authenticated.
 */
async function getClerkId(ctx: QueryCtx): Promise<string> {
  const identity = await getClerkIdentity(ctx);
  return clerkIdFromIdentity(identity);
}

/**
 * Best-effort lookup of the current Convex user row for this request.
 * Returns null when logged out or when the user row hasn't been created yet.
 *
 * This should not throw; it's safe to use in queries that must gracefully return `null`.
 */
async function getAndAuthenticateCurrentConvexUserAllowNull(ctx: QueryCtx | MutationCtx) {
  const clerkId = await getClerkId(ctx);
  return await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
    .first();
}

/**
 * Resolves the current Clerk identity to a Convex user document.
 * This helper is strict: it throws when auth is missing or the user row does not exist.
 */
export async function __backend_only_getAndAuthenticateCurrentConvexUser(
  ctx: QueryCtx
): Promise<Doc<'users'>> {
  const user = await getAndAuthenticateCurrentConvexUserAllowNull(ctx);
  if (!user) {
    throw new Error('No Convex user found for the current Clerk token');
  }

  return user;
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
      .query('usersToEvents')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect(),
    ctx.db
      .query('friendRecs')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .first(),
  ]);

  const events = (
    await Promise.all(userEventLinks.map((link: Doc<'usersToEvents'>) => ctx.db.get(link.eventId)))
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

// Called from the client after sign-in so `getCurrentProfile` can resolve without manual DB fixes.
export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await getAndAuthenticateCurrentConvexUserAllowNull(ctx);
    if (existing) {
      return existing._id;
    }

    const identity = await getClerkIdentity(ctx);

    // New Clerk user: `clerkId` must match the stable id on `ctx.auth` (Clerk `clerkId` claim).
    return await ctx.db.insert('users', {
      name: identity.username!,
      clerkId: clerkIdFromIdentity(identity),
    });
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

export const getProfileByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_name', (q) => q.eq('name', name))
      .first();

    if (!user) {
      return null;
    }

    return await buildProfile(ctx, user);
  },
});
