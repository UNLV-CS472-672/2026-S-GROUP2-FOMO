import { v } from 'convex/values';

import { query } from './_generated/server';

export const getPostsByEventId = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    return await ctx.db
      .query('posts')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect();
  },
});

export const getPostById = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) {
      return null;
    }

    const mediaIds = Array.isArray(post.mediaIds)
      ? post.mediaIds
      : post.mediaIds
        ? [post.mediaIds]
        : [];

    const [author, comments] = await Promise.all([
      ctx.db.get(post.authorId),
      ctx.db
        .query('comments')
        .withIndex('by_post', (q) => q.eq('postId', postId))
        .collect(),
    ]);

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const commentAuthor = await ctx.db.get(comment.authorId);

        return {
          id: comment._id,
          authorName: commentAuthor?.displayName || commentAuthor?.username || 'Unknown user',
          authorAvatarUrl: commentAuthor?.avatarUrl || '',
          text: comment.text,
        };
      })
    );

    return {
      id: post._id,
      caption: post.caption ?? '',
      mediaIds,
      likeCount: post.likeCount ?? 0,
      authorName: author?.displayName || author?.username || 'Unknown user',
      authorAvatarUrl: author?.avatarUrl || '',
      comments: commentsWithAuthors,
    };
  },
});
