import { v, Validator } from 'convex/values';
import { TableNames } from './_generated/dataModel';
import { query } from './_generated/server';

// Queries and returns the entire "table_name" table.
export const list = query({
  args: { table_name: v.string() as Validator<TableNames> },
  handler: async (ctx, { table_name }) => {
    try {
      return await ctx.db.query(table_name).collect();
    } catch (error) {
      console.error('Error querying table:', table_name, error);
      throw new Error(`Failed to list records from ${table_name}`);
    }
  },
});

// Checks if a user exists in "users" via tokenIdentifier.
export const userToken = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', name))
      .first();
  },
});

// Checks if a user exists in "users" via id.
export const userId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Checks if a user exists in "friends" via userId.
// Given input "userA", checks and returns "userB" if exists, null otherwise.
export const friend_exists = query({
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
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
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
