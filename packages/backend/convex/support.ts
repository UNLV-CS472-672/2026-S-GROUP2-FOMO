import { v } from 'convex/values';

import { mutation } from './_generated/server';

export const createSupportRequest = mutation({
  args: {
    email: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { email, description }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDescription = description.trim();

    if (!normalizedEmail) {
      throw new Error('Email is required.');
    }

    if (!normalizedDescription) {
      throw new Error('Description is required.');
    }

    return await ctx.db.insert('support', {
      email: normalizedEmail,
      description: normalizedDescription,
    });
  },
});
