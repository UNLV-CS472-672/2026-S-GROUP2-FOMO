import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type QueryCtx } from './_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './auth';

export type SerializedComment = {
  id: Id<'comments'>;
  text: string;
  authorName: string;
  creationTime: number;
  replyAuthorName?: string;
  parentId?: Id<'comments'>;
  replies: SerializedComment[];
};

function buildCommentTree(comments: Omit<SerializedComment, 'replies'>[]): SerializedComment[] {
  const byId = new Map<Id<'comments'>, SerializedComment>();
  const roots: SerializedComment[] = [];

  for (const comment of comments) {
    byId.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of comments) {
    const node = byId.get(comment.id);
    if (node == null) {
      continue;
    }

    if (comment.parentId == null) {
      roots.push(node);
      continue;
    }

    const parent = byId.get(comment.parentId);
    if (parent == null) {
      roots.push(node);
      continue;
    }

    parent.replies.push(node);
  }

  return roots;
}

function flattenReplies(
  comments: SerializedComment[],
  replyAuthorName?: string
): SerializedComment[] {
  return comments.flatMap((comment) => [
    {
      ...comment,
      replyAuthorName,
      replies: [],
    },
    ...flattenReplies(comment.replies, comment.authorName),
  ]);
}

function normalizeThread(comments: SerializedComment[]): SerializedComment[] {
  return comments
    .sort((a, b) => a.creationTime - b.creationTime)
    .map((comment) => ({
      ...comment,
      replies: flattenReplies(comment.replies, comment.authorName).sort(
        (a, b) => a.creationTime - b.creationTime
      ),
    }));
}

export async function getThreadedCommentsByPost(ctx: QueryCtx, postId: Doc<'posts'>['_id']) {
  const comments = await ctx.db
    .query('comments')
    .withIndex('by_post', (q) => q.eq('postId', postId))
    .collect();

  comments.sort((a, b) => a._creationTime - b._creationTime);

  const commentsWithAuthors = await Promise.all(
    comments.map(async (comment) => {
      const commentAuthor = await ctx.db.get(comment.authorId);

      return {
        id: comment._id,
        text: comment.text,
        authorName: commentAuthor?.displayName || commentAuthor?.username || 'Unknown user',
        creationTime: comment._creationTime,
        parentId: comment.parentId,
      };
    })
  );

  return normalizeThread(buildCommentTree(commentsWithAuthors));
}

export const listByPost = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    return await getThreadedCommentsByPost(ctx, postId);
  },
});

export const createComment = mutation({
  args: {
    postId: v.id('posts'),
    text: v.string(),
    parentId: v.optional(v.id('comments')),
  },
  handler: async (ctx, { postId, text, parentId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    await ctx.db.insert('comments', {
      postId,
      authorId: user._id,
      text: text.trim(),
      ...(parentId !== undefined && { parentId }),
    });
  },
});
