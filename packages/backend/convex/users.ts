import { v } from 'convex/values';

import { Doc, Id } from './_generated/dataModel';
import { mutation, MutationCtx, query, QueryCtx } from './_generated/server';

function displayNameFromClerk(identity: {
  name?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
}): string {
  const jwtCombined = [identity.givenName, identity.familyName].filter(Boolean).join(' ').trim();
  const emailLocal = identity.email?.split('@')[0]?.trim() || '';

  return identity.name?.trim() || jwtCombined || emailLocal || 'User';
}

function mutationCtxAsQueryCtx(ctx: MutationCtx): QueryCtx {
  return ctx as unknown as QueryCtx;
}

async function getClerkTokenIdentifier(ctx: Pick<QueryCtx, 'auth'>): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.tokenIdentifier ?? null;
}

async function tokenIdentifierToConvexUser(ctx: Pick<QueryCtx, 'db'>, tokenIdentifier: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_token', (q) => q.eq('tokenIdentifier', tokenIdentifier))
    .first();
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
    const queryCtx = mutationCtxAsQueryCtx(ctx);
    const tokenIdentifier = await getClerkTokenIdentifier(queryCtx);

    if (!tokenIdentifier) {
      return null;
    }

    const user = await tokenIdentifierToConvexUser(queryCtx, tokenIdentifier);

    if (user) {
      return user._id;
    }

    //normally this is not needed, but when trying to resolve the name, we will use it
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // New Clerk user: row must use the same `tokenIdentifier` Convex puts on `ctx.auth`.
    return await ctx.db.insert('users', {
      name: displayNameFromClerk(identity),
      tokenIdentifier: identity.tokenIdentifier,
    });
  },
});

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getClerkTokenIdentifier(ctx);

    if (!tokenIdentifier) {
      return null;
    }

    const user = await tokenIdentifierToConvexUser(ctx, tokenIdentifier);

    if (!user) {
      return null;
    }

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
