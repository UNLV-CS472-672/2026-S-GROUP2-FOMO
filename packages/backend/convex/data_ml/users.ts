// ----------------------------------------------------
//  Convex helper functions for 'users' data table.
// -----------------------------------------------------

import { v } from 'convex/values';
import { query } from '../_generated/server';

// Checks if a user exists in "users" via tokenIdentifier.
export const queryByToken = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', name))
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
