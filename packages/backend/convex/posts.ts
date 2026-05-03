import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './auth';
import { getAvatarUrlForUser, getDisplayNameForUser } from './user_identity';

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
    await ctx.db.patch(user._id, { friendRecNeedsUpdate: true });
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
          authorName: getDisplayNameForUser(commentAuthor),
          authorAvatarUrl: getAvatarUrlForUser(commentAuthor),
          text: comment.text,
        };
      })
    );

    return {
      id: post._id,
      caption: post.caption ?? '',
      mediaIds,
      likeCount: post.likeCount ?? 0,
      authorName: getDisplayNameForUser(author),
      authorAvatarUrl: getAvatarUrlForUser(author),
      comments: commentsWithAuthors,
    };
  },
});
