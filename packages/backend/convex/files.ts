import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query, type QueryCtx } from './_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './auth';

type FileMetadata = {
  contentType?: string;
};

export async function serializeStorageFile(ctx: QueryCtx, storageId: Id<'_storage'>) {
  const [url, metadata] = await Promise.all([
    ctx.storage.getUrl(storageId),
    ctx.db.system.get('_storage', storageId) as Promise<FileMetadata | null>,
  ]);

  return {
    url,
    contentType: metadata?.contentType ?? null,
    isVideo: metadata?.contentType?.startsWith('video/') ?? false,
  };
}

export async function serializeStorageFiles(ctx: QueryCtx, storageIds: Array<Id<'_storage'>>) {
  return await Promise.all(storageIds.map((id) => serializeStorageFile(ctx, id)));
}

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
    return await serializeStorageFile(ctx, args.storageId);
  },
});
