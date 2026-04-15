// ----------------------------------------------------
//  Convex helper functions for 'users' data table.
// -----------------------------------------------------

import { v } from 'convex/values';
import { query } from '../_generated/server';

// Checks if a user exists in "users" via Clerk ID.
export const queryByClerkId = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', name))
      .first();
  },
});

// Checks if a user exists in "users" via id.
export const userExists = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Extracts all userIds from the `users` table.
export const getAllUserIds = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    return users.map((user) => user._id);
  },
});

// Given a "userId", return "name".
export const getNameById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.name ?? null;
  },
});
