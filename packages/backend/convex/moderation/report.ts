import { v } from 'convex/values';

import type { Id } from '../_generated/dataModel';
import { mutation, type MutationCtx } from '../_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from '../auth';

async function createReport(
  ctx: MutationCtx,
  {
    reporterId,
    targetType,
    targetUserId,
    targetPostId,
    targetCommentId,
    targetEventId,
    reason,
    details,
  }: {
    reporterId: Id<'users'>;
    targetType: 'user' | 'post' | 'comment' | 'event';
    targetUserId?: Id<'users'>;
    targetPostId?: Id<'posts'>;
    targetCommentId?: Id<'comments'>;
    targetEventId?: Id<'events'>;
    reason: string;
    details?: string;
  }
) {
  await ctx.db.insert('moderationReports', {
    reporterId,
    targetType,
    ...(targetUserId ? { targetUserId } : {}),
    ...(targetPostId ? { targetPostId } : {}),
    ...(targetCommentId ? { targetCommentId } : {}),
    ...(targetEventId ? { targetEventId } : {}),
    reason,
    ...(details?.trim() ? { details: details.trim() } : {}),
    source: 'report',
    status: 'open',
  });
}

export const reportUser = mutation({
  args: {
    userId: v.id('users'),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { userId, reason, details }) => {
    const reporter = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);

    if (reporter._id === userId) {
      throw new Error('You cannot report yourself.');
    }

    const targetUser = await ctx.db.get(userId);
    if (!targetUser) {
      throw new Error('User not found.');
    }

    await createReport(ctx, {
      reporterId: reporter._id,
      targetType: 'user',
      targetUserId: userId,
      reason,
      details,
    });
  },
});

export const reportPost = mutation({
  args: {
    postId: v.id('posts'),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { postId, reason, details }) => {
    const reporter = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error('Post not found.');
    }

    await createReport(ctx, {
      reporterId: reporter._id,
      targetType: 'post',
      targetPostId: postId,
      targetUserId: post.authorId,
      reason,
      details,
    });
  },
});

export const reportComment = mutation({
  args: {
    commentId: v.id('comments'),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { commentId, reason, details }) => {
    const reporter = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const comment = await ctx.db.get(commentId);
    if (!comment) {
      throw new Error('Comment not found.');
    }

    await createReport(ctx, {
      reporterId: reporter._id,
      targetType: 'comment',
      targetCommentId: commentId,
      targetUserId: comment.authorId,
      reason,
      details,
    });
  },
});

export const reportEvent = mutation({
  args: {
    eventId: v.id('events'),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, reason, details }) => {
    const reporter = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error('Event not found.');
    }

    await createReport(ctx, {
      reporterId: reporter._id,
      targetType: 'event',
      targetEventId: eventId,
      reason,
      details,
    });
  },
});
