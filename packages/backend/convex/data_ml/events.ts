import { latLngToCell } from 'h3-js';
import { query } from '../_generated/server';

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

export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query('events').withIndex('by_startDate').collect();

    const eventsWithAttendance = await Promise.all(
      events.map(async (event) => {
        const attendees = await ctx.db
          .query('usersToEvents')
          .withIndex('by_event', (q) => q.eq('eventId', event._id))
          .collect();

        return {
          ...event,
          attendeeCount: attendees.length,
        };
      })
    );

    return eventsWithAttendance;
  },
});
