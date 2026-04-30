import type { Id } from './_generated/dataModel';
import { query, type QueryCtx } from './_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './auth';

export async function getEventRecIdsForUser(
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<Id<'events'>[]> {
  const row = await ctx.db
    .query('eventRecs')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first();

  return row?.eventIds ?? [];
}

/** Rank 0 → 1, rank 1 → ½, … (same as previous getEvents scoring). */
export function recommendationScoresFromRecIds(
  eventIds: Id<'events'>[]
): Map<Id<'events'>, number> {
  return new Map(eventIds.map((eventId, index) => [eventId, 1 / (index + 1)] as const));
}

export const getCurrentUserEventRecs = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    return await getEventRecIdsForUser(ctx, user._id);
  },
});
