import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './users';

// ─── Post Likes ───────────────────────────────────────────────

export const togglePostLike = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const userId = user._id;

    const existing = await ctx.db
      .query('userPostLike')
      .withIndex('by_userId_postId', (q) => q.eq('userId', userId).eq('postId', postId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(postId, {
        likeCount: Math.max(0, ((await ctx.db.get(postId))?.likeCount ?? 1) - 1),
      });
      return { liked: false };
    }

    await ctx.db.insert('userPostLike', { userId, postId });
    const post = await ctx.db.get(postId);
    await ctx.db.patch(postId, {
      likeCount: (post?.likeCount ?? 0) + 1,
    });
    return { liked: true };
  },
});

export const hasUserLikedPost = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const userId = user._id;

    if (!userId) return false;

    const existing = await ctx.db
      .query('userPostLike')
      .withIndex('by_userId_postId', (q) => q.eq('userId', userId).eq('postId', postId))
      .unique();

    return existing !== null;
  },
});

export const getPostLikeCount = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    return post?.likeCount ?? 0;
  },
});

export const getUserLikedPosts = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const userId = user._id;

    const likes = await ctx.db
      .query('userPostLike')
      .withIndex('by_userId_postId', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();

    const posts = await Promise.all(
      likes.map(async (like) => {
        const post = await ctx.db.get(like.postId);
        return post; // filter out nulls downstream if posts get deleted
      })
    );

    return posts.filter(Boolean);
  },
});

// ─── Comment Likes ────────────────────────────────────────────

export const toggleCommentLike = mutation({
  args: { commentId: v.id('comments') },
  handler: async (ctx, { commentId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const userId = user._id;

    const existing = await ctx.db
      .query('userCommentLike')
      .withIndex('by_userId_commentId', (q) => q.eq('userId', userId).eq('commentId', commentId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(commentId, {
        likeCount: Math.max(0, ((await ctx.db.get(commentId))?.likeCount ?? 1) - 1),
      });
      return { liked: false };
    }

    await ctx.db.insert('userCommentLike', { userId, commentId });
    const comment = await ctx.db.get(commentId);
    await ctx.db.patch(commentId, {
      likeCount: (comment?.likeCount ?? 0) + 1,
    });
    return { liked: true };
  },
});

export const hasUserLikedComment = query({
  args: { commentId: v.id('comments') },
  handler: async (ctx, { commentId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const userId = user._id;

    if (!userId) return false;

    const existing = await ctx.db
      .query('userCommentLike')
      .withIndex('by_userId_commentId', (q) => q.eq('userId', userId).eq('commentId', commentId))
      .unique();

    return existing !== null;
  },
});

export const getCommentLikeCount = query({
  args: { commentId: v.id('comments') },
  handler: async (ctx, { commentId }) => {
    const comment = await ctx.db.get(commentId);
    return comment?.likeCount ?? 0;
  },
});
