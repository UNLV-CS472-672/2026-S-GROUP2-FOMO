import { v } from 'convex/values';
import { query } from './_generated/server';

/**
 * Return a URL for a Convex storage file
 */
export const getUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
