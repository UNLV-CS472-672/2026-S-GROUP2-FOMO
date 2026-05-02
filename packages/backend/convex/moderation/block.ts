import { v } from 'convex/values';

import type { Id } from '../_generated/dataModel';
import { mutation, query, type QueryCtx } from '../_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from '../auth';

export async function getBlockedUserIds(
  ctx: QueryCtx,
  blockerId?: Id<'users'>
): Promise<Set<Id<'users'>>> {
  if (!blockerId) {
    return new Set();
  }

  const blockedUsers = await ctx.db
    .query('blockedUsers')
    .withIndex('by_blockerId', (q) => q.eq('blockerId', blockerId))
    .collect();

  return new Set(blockedUsers.map((row) => row.blockedUserId));
}

export const getBlockedUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const blockedRows = await ctx.db
      .query('blockedUsers')
      .withIndex('by_blockerId', (q) => q.eq('blockerId', currentUser._id))
      .collect();

    const blockedUsers = await Promise.all(
      blockedRows.map(async (row) => {
        const user = await ctx.db.get(row.blockedUserId);
        if (!user) {
          return null;
        }

        return {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          blockedAt: row._creationTime,
        };
      })
    );

    return blockedUsers.filter((user): user is NonNullable<typeof user> => user !== null);
  },
});

export const blockUser = mutation({
  args: {
    userId: v.id('users'),
    reason: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { userId, reason, details }) => {
    const blocker = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);

    if (blocker._id === userId) {
      throw new Error('You cannot block yourself.');
    }

    const targetUser = await ctx.db.get(userId);
    if (!targetUser) {
      throw new Error('User not found.');
    }

    const existingBlock = await ctx.db
      .query('blockedUsers')
      .withIndex('by_blockerId_blockedUserId', (q) =>
        q.eq('blockerId', blocker._id).eq('blockedUserId', userId)
      )
      .unique();

    if (!existingBlock) {
      await ctx.db.insert('blockedUsers', {
        blockerId: blocker._id,
        blockedUserId: userId,
      });
    }

    await ctx.db.insert('moderationReports', {
      reporterId: blocker._id,
      targetType: 'user',
      targetUserId: userId,
      reason: reason?.trim() || 'Blocked for abusive or objectionable content',
      ...(details?.trim() ? { details: details.trim() } : {}),
      source: 'block',
      status: 'open',
    });
  },
});

export const unblockUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const currentUser = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const existingBlock = await ctx.db
      .query('blockedUsers')
      .withIndex('by_blockerId_blockedUserId', (q) =>
        q.eq('blockerId', currentUser._id).eq('blockedUserId', userId)
      )
      .unique();

    if (!existingBlock) {
      return;
    }

    await ctx.db.delete(existingBlock._id);
  },
});
