// ----------------------------------------------------
//  Convex helper functions for 'users' data table.
// -----------------------------------------------------

import { v } from 'convex/values';
import { internalQuery } from '../_generated/server';

// Checks if a user exists in "users" via id.
export const userExists = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Extracts all userIds from the `users` table.
export const getAllUserIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    return users.map((user) => user._id);
  },
});

// Given a "userId", return the display name.
export const getNameById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.displayName ?? null;
  },
});
