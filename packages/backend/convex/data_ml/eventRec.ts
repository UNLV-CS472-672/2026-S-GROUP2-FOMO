import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

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

export const getInteractionsByUserId = query({
  args: { userId: v.id('users'), sinceMs: v.optional(v.number()) },
  handler: async (ctx, { userId, sinceMs }) => {
    const attendanceRows = await ctx.db
      .query('attendance')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();
    // { userId, eventId, status }[]

    // No value passed for sinceMs, Don't want to filter
    if (sinceMs === undefined) return attendanceRows;

    const withEvents = await Promise.all(
      attendanceRows.map(async (row) => {
        const event = await ctx.db.get(row.eventId);
        return { row, event };
      })
    );

    return withEvents
      .filter(({ event }) => event !== null && event.endDate >= sinceMs)
      .map(({ row }) => row);
  },
});

export const upsertEventRecs = mutation({
  args: {
    userId: v.id('users'),
    eventIds: v.array(v.id('events')),
  },
  handler: async (ctx, { userId, eventIds }) => {
    const existing = await ctx.db
      .query('eventRecs')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        eventIds,
      });
    } else {
      await ctx.db.insert('eventRecs', {
        userId,
        eventIds,
      });
    }
  },
});

export const getUserTagWeightsWithTimestamp = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const result = await ctx.db
      .query('userTagWeights')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();

    if (!result) return null;

    return {
      weights: result.weights,
      lastUpdatedAt: result.updatedAt,
    };
  },
});
