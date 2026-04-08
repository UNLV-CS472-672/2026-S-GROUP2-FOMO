// ---------------------------------------------------
//  Convex helper functions for 'friends' data table.
// --------------------------------------------------

import { v } from 'convex/values';

import { query } from '../_generated/server';
import { getClerkTokenIdentifier, tokenIdentifierToConvexUserIdentifier } from '../users';

// Checks if a user exists in "friends" via userId.
// Given input "userA", checks and returns "userB" if exists, null otherwise.
export const friendExists = query({
  args: {
    userAId: v.id('users'),
    userBId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const friendship = await ctx.db
      .query('friends')
      .withIndex('by_userA_userB', (q) => q.eq('userAId', args.userAId).eq('userBId', args.userBId))
      .unique();

    if (friendship) {
      return friendship.userBId;
    }
    return null;
  },
});

// Retrieves friend recommendations for a user.
// Also determines whether the recommendations are "fresh"
// based on a 24-hour time window.
export const getFriendRecs = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getClerkTokenIdentifier(ctx);

    const userId = await tokenIdentifierToConvexUserIdentifier(ctx, tokenIdentifier);

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
