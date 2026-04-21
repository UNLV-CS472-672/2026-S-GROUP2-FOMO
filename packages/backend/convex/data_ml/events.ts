import { v } from 'convex/values';
import { latLngToCell } from 'h3-js';

import type { Doc, Id } from '../_generated/dataModel';
import { query, type QueryCtx } from '../_generated/server';
import { __backend_only_guestOrAuthenticatedUser } from '../auth';

export function latLngToH3Index(lat: number, lng: number, resolution: number = 9): string {
  if (lat < -90 || lat > 90) {
    throw new RangeError(`Latitude must be between -90 and 90. Got: ${lat}`);
  }
  if (lng < -180 || lng > 180) {
    throw new RangeError(`Longitude must be between -180 and 180. Got: ${lng}`);
  }
  if (!Number.isInteger(resolution) || resolution < 0 || resolution > 15) {
    throw new RangeError(`Resolution must be an integer between 0 and 15. Got: ${resolution}`);
  }
  return latLngToCell(lat, lng, resolution);
}

async function getAttendeeCount(ctx: QueryCtx, eventId: Id<'events'>) {
  const attendees = await ctx.db
    .query('usersToEvents')
    .withIndex('by_event', (q) => q.eq('eventId', eventId))
    .collect();

  return attendees.length;
}

async function serializeEvent(ctx: QueryCtx, event: Doc<'events'>, recommendationScore?: number) {
  const attendeeCount = await getAttendeeCount(ctx, event._id);

  return {
    id: event._id,
    name: event.name,
    caption: event.caption,
    location: event.location,
    attendeeCount,
    startDate: event.startDate,
    endDate: event.endDate,
    mediaId: event.mediaId ?? null,
    hostIds: event.hostIds,
    recommendationScore,
  };
}

export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const [, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);

    const events = await ctx.db.query('events').withIndex('by_startDate').collect();
    return await Promise.all(
      events.map((event, index) =>
        serializeEvent(ctx, event, guestMode ? undefined : 1 / (index + 1))
      )
    );
  },
});

export const getEventById = query({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const normalizedEventId = await ctx.db.normalizeId('events', eventId);
    if (!normalizedEventId) {
      return null;
    }

    const event = await ctx.db.get(normalizedEventId);
    if (!event) {
      return null;
    }

    return await serializeEvent(ctx, event);
  },
});
