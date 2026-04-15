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

// Unique user ids that have at least one row in `usersToEvents` (i.e. attended an event).
// Ensures that getting all user ids doesn't break later recommendation steps, mainly for the
// similarity score logic as it would raise a KeyError. Can also be changed to get all user Ids in the future.
export const getUserIdsWithEventAttendance = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('usersToEvents').collect();
    const uniqueUserIds = new Set<string>();
    for (const row of rows) {
      uniqueUserIds.add(row.userId);
    }
    return Array.from(uniqueUserIds);
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
