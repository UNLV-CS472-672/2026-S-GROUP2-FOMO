import { v } from 'convex/values';

import { query } from './_generated/server';

export const getPostById = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) {
      return null;
    }

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
          text: comment.text,
        };
      })
    );

    return {
      id: post._id,
      title: post.title,
      description: post.description,
      authorName: author?.displayName || author?.username || 'Unknown user',
      comments: commentsWithAuthors,
    };
  },
});
