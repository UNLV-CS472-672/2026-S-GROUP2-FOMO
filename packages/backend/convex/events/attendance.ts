import { Id } from '../_generated/dataModel';
import { QueryCtx } from '../_generated/server';

export async function getAttendeeCount(ctx: QueryCtx, eventId: Id<'events'>) {
  const attendees = await ctx.db
    .query('usersToEvents')
    .withIndex('by_event', (q) => q.eq('eventId', eventId))
    .collect();

  return attendees.length;
}

export const getAttendeesByEventId = async (ctx: QueryCtx, eventId: Id<'events'>) => {
  const attendees = await ctx.db
    .query('usersToEvents')
    .withIndex('by_event', (q) => q.eq('eventId', eventId))
    .collect();

  return attendees.map((attendee) => attendee.userId);
};
