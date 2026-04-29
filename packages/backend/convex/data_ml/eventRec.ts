import { v } from 'convex/values';
import { internalMutation, internalQuery, query } from '../_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from '../auth';

export const getByUserId = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('attendance')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('status'), 'going'))
      .collect();
  },
});

export const getByEventId = internalQuery({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    return await ctx.db
      .query('eventTags')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect();
  },
});

export const upsertUserTagWeights = internalMutation({
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

export const getUserTagWeights = internalQuery({
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

export const getInteractionsByUserId = internalQuery({
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

export const upsertEventRecs = internalMutation({
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
      await ctx.db.patch(existing._id, { eventIds });
    } else {
      await ctx.db.insert('eventRecs', { userId, eventIds });
    }
  },
});

// Returns the current user's top-K event IDs in rank order
// (index 0 = #1 rec). Returns null when no recs have been computed yet.
export const getCurrentUserEventRecs = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const doc = await ctx.db
      .query('eventRecs')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();
    return doc?.eventIds ?? null;
  },
});

export const getUserTagWeightsWithTimestamp = internalQuery({
  args: {
    userId: v.id('users'),
    numTags: v.number(),
  },
  handler: async (ctx, { userId, numTags }) => {
    const result = await ctx.db
      .query('userTagWeights')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();

    if (!result) {
      return {
        weights: new Array(numTags * 3).fill(0),
        lastUpdatedAt: 0,
      };
    }

    return {
      weights: result.weights,
      lastUpdatedAt: result.updatedAt,
    };
  },
});

export const getPreferredTagsByUserId = internalQuery({
  args: { userIds: v.array(v.id('users')) },
  handler: async (ctx, { userIds }) => {
    return await Promise.all(
      userIds.map(async (userId) => {
        const doc = await ctx.db
          .query('userTagPreferences')
          .withIndex('by_userId', (q) => q.eq('userId', userId))
          .unique();
        return doc?.tags ?? [];
      })
    );
  },
});

export const getUsersWithRecentActivity = internalQuery({
  args: { userIds: v.array(v.id('users')), numTags: v.optional(v.number()) },
  handler: async (ctx, { userIds, numTags }) => {
    const results = await Promise.all(
      userIds.map(async (userId) => {
        const weightsRow = await ctx.db
          .query('userTagWeights')
          .withIndex('by_userId', (q) => q.eq('userId', userId))
          .unique();

        const lastUpdated = weightsRow?.updatedAt ?? 0;

        const newestInteraction = await ctx.db
          .query('attendance')
          .withIndex('by_userId', (q) => q.eq('userId', userId))
          .order('desc')
          .first();

        const hasRecentActiviy =
          newestInteraction !== null && newestInteraction._creationTime > lastUpdated;

        const weights =
          weightsRow?.weights ?? (numTags !== undefined ? new Array(numTags * 3).fill(0) : null);

        return {
          userId,
          lastUpdated,
          weights,
        };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});
