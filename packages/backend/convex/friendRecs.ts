import { v } from 'convex/values';
import { mutation } from './_generated/server';

export const upsert = mutation({
  args: {
    user: v.string(), // Change to ID
    recs: v.array(
      v.object({
        userId: v.string(),
        score: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("friendRecs")
      .withIndex("by_user", (q) => q.eq("user", args.user))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        recs: args.recs,
      });
    } else {
      await ctx.db.insert('friendRecs', {
        user: args.user,
        recs: args.recs,
      });
    }
  },
});