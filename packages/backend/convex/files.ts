import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './auth';

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

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
