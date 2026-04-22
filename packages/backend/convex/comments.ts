import { v } from 'convex/values';

import { mutation } from './_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './auth';

export const createComment = mutation({
  args: {
    postId: v.id('posts'),
    text: v.string(),
  },
  handler: async (ctx, { postId, text }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    await ctx.db.insert('comments', {
      postId,
      authorId: user._id,
      text: text.trim(),
    });
  },
});
