import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { internalMutation, internalQuery, MutationCtx, query } from '../_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from '../auth';

async function getInteractionsForUser(ctx: MutationCtx, userId: Id<'users'>, sinceMs?: number) {
  if (sinceMs === undefined) {
    return await ctx.db
      .query('attendance')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();
  }
  // Incremental path: only rows touched since last weight update,
  // and only where status actually differs from what we last folded in.
  const attendanceRows = await ctx.db
    .query('attendance')
    .withIndex('by_userId_updatedAt', (q) => q.eq('userId', userId).gte('updatedAt', sinceMs))
    .filter((q) => q.neq(q.field('status'), q.field('previousStatus'))) // Only get rows where the interaction is different from last we updated weights
    .collect();

  // Mark these rows as processed by setting previousStatus = status.
  await Promise.all(
    attendanceRows.map((row) => ctx.db.patch(row._id, { previousStatus: row.status }))
  );

  return attendanceRows;
}

async function upsertUserTagWeightsRow(
  ctx: MutationCtx,
  userId: Id<'users'>,
  weights: number[],
  lastDecayedAt?: number
) {
  const existing = await ctx.db
    .query('userTagWeights')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first();

  if (existing) {
    const patch: { weights: number[]; updatedAt: number; lastDecayedAt?: number } = {
      weights,
      updatedAt: Date.now(),
    };
    if (lastDecayedAt !== undefined) {
      patch.lastDecayedAt = lastDecayedAt;
    }
    await ctx.db.patch(existing._id, patch);
  } else {
    await ctx.db.insert('userTagWeights', {
      userId,
      weights,
      updatedAt: Date.now(),
      lastDecayedAt: lastDecayedAt !== undefined ? lastDecayedAt : Date.now(),
    });
  }
}

function formatUserTagWeightsWithTimestamp(
  result: { weights: number[]; updatedAt: number; lastDecayedAt: number } | null,
  numTags: number
) {
  if (!result) {
    return {
      weights: new Array(numTags * 3).fill(0),
      updatedAt: 0,
      lastDecayedAt: Date.now(),
    };
  }

  return {
    weights: result.weights,
    updatedAt: result.updatedAt,
    lastDecayedAt: result.lastDecayedAt,
  };
}

export const getByEventIds = internalQuery({
  args: { eventIds: v.array(v.id('events')) },
  handler: async (ctx, { eventIds }) => {
    const uniqueEventIds = [...new Set(eventIds)];
    const results = await Promise.all(
      uniqueEventIds.map((eventId) =>
        ctx.db
          .query('eventTags')
          .withIndex('by_event', (q) => q.eq('eventId', eventId))
          .collect()
      )
    );

    return results.flat();
  },
});

export const upsertUserTagWeightsBatch = internalMutation({
  args: {
    rows: v.array(
      v.object({
        userId: v.id('users'),
        weights: v.array(v.number()),
        lastDecayedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { rows }) => {
    await Promise.all(
      rows.map(({ userId, weights, lastDecayedAt }) =>
        upsertUserTagWeightsRow(ctx, userId, weights, lastDecayedAt)
      )
    );
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

export const getInteractionsByUsers = internalMutation({
  args: {
    rows: v.array(
      v.object({
        userId: v.id('users'),
        sinceMs: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { rows }) => {
    const results = await Promise.all(
      rows.map(({ userId, sinceMs }) => getInteractionsForUser(ctx, userId, sinceMs))
    );

    return results.flat();
  },
});

export const getInteractionsByUserIds = internalQuery({
  args: { userIds: v.array(v.id('users')) },
  handler: async (ctx, { userIds }) => {
    const results = await Promise.all(
      userIds.map((userId) =>
        ctx.db
          .query('attendance')
          .withIndex('by_userId', (q) => q.eq('userId', userId))
          .collect()
      )
    );

    return results.flat();
  },
});

export const upsertEventRecsBatch = internalMutation({
  args: {
    rows: v.array(
      v.object({
        userId: v.id('users'),
        eventIds: v.array(v.id('events')),
      })
    ),
  },
  handler: async (ctx, { rows }) => {
    await Promise.all(
      rows.map(async ({ userId, eventIds }) => {
        const existing = await ctx.db
          .query('eventRecs')
          .withIndex('by_userId', (q) => q.eq('userId', userId))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, { eventIds });
        } else {
          await ctx.db.insert('eventRecs', { userId, eventIds });
        }
      })
    );
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

export const getUserTagWeightsWithTimestamps = internalQuery({
  args: {
    userIds: v.array(v.id('users')),
    numTags: v.number(),
  },
  handler: async (ctx, { userIds, numTags }) => {
    const rows = await ctx.db.query('userTagWeights').collect();
    const rowsByUserId = new Map(rows.map((row) => [row.userId, row]));

    return userIds.map((userId) => ({
      userId,
      ...formatUserTagWeightsWithTimestamp(rowsByUserId.get(userId) ?? null, numTags),
    }));
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

export const getUsersWithRecentActivity = internalMutation({
  args: { numTags: v.optional(v.number()) },
  handler: async (ctx, { numTags }) => {
    const allUsers = await ctx.db.query('users').collect();

    const results = await Promise.all(
      allUsers.map(async (user) => {
        const userId = user._id;

        const weightsRow = await ctx.db
          .query('userTagWeights')
          .withIndex('by_userId', (q) => q.eq('userId', userId))
          .unique();

        const updatedAt = weightsRow?.updatedAt ?? 0;
        const lastDecayedAt = weightsRow?.lastDecayedAt ?? Date.now();

        const newestInteraction = await ctx.db
          .query('attendance')
          .withIndex('by_userId_updatedAt', (q) => q.eq('userId', userId))
          .order('desc')
          .first();

        const needsSeeding = weightsRow === null;
        const hasRecentActivity =
          newestInteraction !== null && newestInteraction.updatedAt > updatedAt;

        if (!hasRecentActivity) {
          if (needsSeeding && numTags !== undefined) {
            await ctx.db.insert('userTagWeights', {
              userId,
              weights: new Array(numTags * 3).fill(0),
              updatedAt: Date.now(),
              lastDecayedAt: Date.now(),
            });
          }
          return null;
        }

        const weights =
          weightsRow?.weights ?? (numTags !== undefined ? new Array(numTags * 3).fill(0) : null);

        return {
          userId,
          updatedAt,
          weights,
          lastDecayedAt,
        };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const getAllEventsAfterNow = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();

    const events = await ctx.db
      .query('events')
      .withIndex('by_endDate', (q) => q.gte('endDate', now))
      .collect();

    const externalEvents = await ctx.db
      .query('externalEvents')
      .withIndex('by_endDate', (q) => q.gte('endDate', now))
      .collect();

    return [
      ...events.map((e) => ({ ...e, source: 'internal' as const })),
      ...externalEvents.map((e) => ({ ...e, source: 'external' as const })),
    ];
  },
});
