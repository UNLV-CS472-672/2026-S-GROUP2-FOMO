import { v } from 'convex/values';
import { mutation } from './_generated/server';

export const upsert = mutation({
  args: {
    user: v.string(),
    rec1: v.string(),
    rec2: v.string(),
    rec3: v.string(),
    rec4: v.string(),
    rec5: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('friendRecs')
      .filter((q) => q.eq(q.field('user'), args.user))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rec1: args.rec1,
        rec2: args.rec2,
        rec3: args.rec3,
        rec4: args.rec4,
        rec5: args.rec5,
      });
    } else {
      await ctx.db.insert('friendRecs', {
        user: args.user,
        rec1: args.rec1,
        rec2: args.rec2,
        rec3: args.rec3,
        rec4: args.rec4,
        rec5: args.rec5,
      });
    }
  },
});
