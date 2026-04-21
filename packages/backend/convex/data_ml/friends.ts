// ---------------------------------------------------
//  Convex helper functions for 'friends' data table.
// --------------------------------------------------

import { v } from 'convex/values';

import { query } from '../_generated/server';

import { __backend_only_getAndAuthenticateCurrentConvexUser } from '../auth';

// Checks if a user exists in "friends" via userId.
// Given input "userA", checks for a matching "userB" if 'status' is accepted.
// Considers both directions, since database is unidirectional.
export const friendExists = query({
  args: {
    userAId: v.id('users'),
    userBId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // requesterId -> recipientId
    const friendship = await ctx.db
      .query('friends')
      .withIndex('by_recipientId_requesterId', (q) =>
        q.eq('recipientId', args.userBId).eq('requesterId', args.userAId)
      )
      .filter((q) => q.eq(q.field('status'), 'accepted'))
      .unique();
    if (friendship) return args.userBId;

    // recipientId -> requesterId
    const reverseFriendship = await ctx.db
      .query('friends')
      .withIndex('by_recipientId_requesterId', (q) =>
        q.eq('recipientId', args.userAId).eq('requesterId', args.userBId)
      )
      .filter((q) => q.eq(q.field('status'), 'accepted'))
      .unique();
    if (reverseFriendship) return args.userBId;

    return null;
  },
});

// Retrieves friend recommendations for a user.
// Also determines whether the recommendations are "fresh"
// based on a 24-hour time window.
export const getFriendRecs = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const userId = user._id;

    const rec = await ctx.db
      .query('friendRecs')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();

    if (!rec) return null;

    const now = Date.now();
    const INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

    const isFresh = rec.updatedAt ? now - rec.updatedAt < INTERVAL : false;

    return {
      recs: rec.recs,
      isFresh,
      updatedAt: rec.updatedAt,
    };
  },
});

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const [requested, received] = await Promise.all([
      ctx.db
        .query('friends')
        .withIndex('by_requesterId', (q) => q.eq('requesterId', user._id))
        .filter((q) => q.eq(q.field('status'), 'accepted'))
        .collect(),
      ctx.db
        .query('friends')
        .withIndex('by_recipientId', (q) => q.eq('recipientId', user._id))
        .filter((q) => q.eq(q.field('status'), 'accepted'))
        .collect(),
    ]);

    const friendIds = [
      ...requested.map((friendship) => friendship.recipientId),
      ...received.map((friendship) => friendship.requesterId),
    ];

    const friends = (await Promise.all(friendIds.map((friendId) => ctx.db.get(friendId)))).filter(
      (friend): friend is NonNullable<typeof friend> => friend !== null
    );

    return friends
      .map((friend) => ({
        id: friend._id,
        username: friend.username,
        displayName: friend.displayName,
        avatarUrl: friend.avatarUrl,
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
  },
});
