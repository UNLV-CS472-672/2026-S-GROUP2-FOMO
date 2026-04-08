import { latLngToCell } from 'h3-js';
import { query } from '../_generated/server';
import { eventSeeds } from '../seed';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './users';

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
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);

    //TODO get events with recommendation score based on current user id
    const mock_events = eventSeeds;
    return mock_events.map((event) => ({
      ...event,
      attendeeCount: Math.floor(Math.random() * 100) + 1,
      recommendationScore: Math.random(),
    }));
  },
});
