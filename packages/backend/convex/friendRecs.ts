import { v } from 'convex/values';
import { mutation } from './_generated/server';

export const upsert = mutation({
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
      });
    } else {
      await ctx.db.insert('friendRecs', {
        userId: args.userId,
        recs: args.recs,
      });
    }
  },
});
