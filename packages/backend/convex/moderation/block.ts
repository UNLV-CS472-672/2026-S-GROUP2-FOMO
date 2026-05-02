import { v } from 'convex/values';

import type { Id } from '../_generated/dataModel';
import { mutation, query, type QueryCtx } from '../_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from '../auth';
import {
  DELETED_ACCOUNT_DISPLAY_NAME,
  getAvatarUrlForUser,
  isDeletedAccount,
} from '../user_identity';

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

// Returns IDs of users that should be hidden from viewerId's perspective:
// users they blocked + users who blocked them.
export async function getHiddenUserIds(
  ctx: QueryCtx,
  viewerId?: Id<'users'>
): Promise<Set<Id<'users'>>> {
  if (!viewerId) {
    return new Set();
  }

  const [blockedByViewer, blockingViewer] = await Promise.all([
    ctx.db
      .query('blockedUsers')
      .withIndex('by_blockerId', (q) => q.eq('blockerId', viewerId))
      .collect(),
    ctx.db
      .query('blockedUsers')
      .withIndex('by_blockedUserId', (q) => q.eq('blockedUserId', viewerId))
      .collect(),
  ]);

  return new Set([
    ...blockedByViewer.map((r) => r.blockedUserId),
    ...blockingViewer.map((r) => r.blockerId),
  ]);
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

        const deleted = isDeletedAccount(user);
        return {
          id: user._id,
          username: deleted ? DELETED_ACCOUNT_DISPLAY_NAME : user.username,
          avatarUrl: getAvatarUrlForUser(user),
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
