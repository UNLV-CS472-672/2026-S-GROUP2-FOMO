// -------------------------------------------------------
//  Convex helper functions for 'friendRecs' data table.
// -------------------------------------------------------

import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

// If target user already has a row in "friendRecs", update the row.
// If target doesn't exist in "friendRecs", add the row.
export const upsert = internalMutation({
  args: {
    userId: v.id('users'),
    recs: v.array(
      v.object({
        userId: v.id('users'),
        score: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('friendRecs')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        recs: args.recs,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('friendRecs', {
        userId: args.userId,
        recs: args.recs,
        updatedAt: Date.now(),
      });
    }
  },
});
