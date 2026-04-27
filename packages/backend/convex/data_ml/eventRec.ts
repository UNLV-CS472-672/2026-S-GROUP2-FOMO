import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from '../auth';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('attendance')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('status'), 'going'))
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

export const getUserTagWeights = query({
  args: { userIDs: v.array(v.id('users')) },
  handler: async (ctx, { userIDs }) => {
    const results = await Promise.all(
      userIDs.map(async (userID) => {
        const doc = await ctx.db
          .query('userTagWeights')
          .withIndex('by_userId', (q) => q.eq('userId', userID))
          .unique();

        return doc?.weights ?? null;
      })
    );

    return results;
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

export const getInteractionsByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('attendance')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();
    // Returns: { userId, eventId, status }[]
  },
});

// Returns the current user's top-K event recommendations in rank order
// (index 0 = #1 rec). Returns null when no recs have been computed yet.
export const getCurrentUserEventRecs = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const doc = await ctx.db
      .query('eventRecs')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();
    return doc?.recs ?? null;
  },
});
