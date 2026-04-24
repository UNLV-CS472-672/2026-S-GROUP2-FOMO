import { v } from 'convex/values';
import { query } from './_generated/server';

/**
 * Return lightweight file data for a Convex storage file
 */
export const getFile = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const [url, metadata] = await Promise.all([
      ctx.storage.getUrl(args.storageId),
      ctx.storage.getMetadata(args.storageId),
    ]);

    return {
      url,
      contentType: metadata?.contentType ?? null,
      isVideo: metadata?.contentType?.startsWith('video/') ?? false,
    };
  },
});
