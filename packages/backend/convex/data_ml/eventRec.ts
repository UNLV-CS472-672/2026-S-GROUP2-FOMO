import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('attendance')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();
  },
});

export const getByEventId = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    return await ctx.db
      .query('eventTags')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect();
  },
});

export const upsertUserTagWeights = mutation({
  args: {
    userId: v.id('users'),
    weights: v.array(v.number()),
  },
  handler: async (ctx, { userId, weights }) => {
    const existing = await ctx.db
      .query('userTagWeights')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        weights,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('userTagWeights', {
        userId,
        weights,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getPreferredTagsByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('userPreferredTags')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();
  },
});
