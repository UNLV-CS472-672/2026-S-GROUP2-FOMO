import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './auth';

export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    mediaIds: v.array(v.id('_storage')),
    eventId: v.id('events'),
    tagIds: v.array(v.id('tags')),
  },
  handler: async (ctx, { caption, mediaIds, eventId, tagIds }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const postId = await ctx.db.insert('posts', {
      caption,
      mediaIds,
      authorId: user._id,
      likeCount: 0,
      eventId,
    });
    await Promise.all(tagIds.map((tagId) => ctx.db.insert('postTags', { postId, tagId })));
    return postId;
  },
});

export const getPostsByEventId = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    return await ctx.db
      .query('posts')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect();
  },
});

export const deletePost = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);

    const post = await ctx.db.get(postId);
    if (!post) throw new Error('Post not found');
    if (post.authorId !== user._id) throw new Error('Not authorized to delete this post');

    const [postTags, postLikes, comments] = await Promise.all([
      ctx.db
        .query('postTags')
        .withIndex('by_post', (q) => q.eq('postId', postId))
        .collect(),
      ctx.db
        .query('likes')
        .withIndex('by_postId', (q) => q.eq('postId', postId))
        .collect(),
      ctx.db
        .query('comments')
        .withIndex('by_post', (q) => q.eq('postId', postId))
        .collect(),
    ]);

    await Promise.all([
      ...postTags.map((pt) => ctx.db.delete(pt._id)),
      ...postLikes.map((l) => ctx.db.delete(l._id)),
      ...comments.map(async (comment) => {
        const commentLikes = await ctx.db
          .query('likes')
          .withIndex('by_commentId', (q) => q.eq('commentId', comment._id))
          .collect();
        await Promise.all(commentLikes.map((l) => ctx.db.delete(l._id)));
        await ctx.db.delete(comment._id);
      }),
      ...post.mediaIds.map((mediaId) => ctx.storage.delete(mediaId)),
    ]);

    await ctx.db.delete(postId);
  },
});

export const getPostById = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) {
      return null;
    }

    const mediaIds = post.mediaIds;

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
