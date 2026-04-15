import { latLngToCell } from 'h3-js';

import type { Doc } from '../_generated/dataModel';
import { query } from '../_generated/server';
import { eventSeeds } from '../seed';
import { __backend_only_guestOrAuthenticatedUser } from '../userAuth';

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

function eventsWithPopularityOnly() {
  const mock_events = eventSeeds;
  return mock_events.map((event, i) => ({
    ...event,
    attendeeCount: 1.0 / i,
  }));
}

function eventsWithRecScoresForUser(_user: Doc<'users'>) {
  const mock_events = eventSeeds;
  return mock_events.map((event, i) => ({
    ...event,
    attendeeCount: i * 100,
    recommendationScore: 1.0 / i,
  }));
}

export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const [user, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);
    if (guestMode) {
      // TODO: fetch from database; popularity-only for guest browse
      return eventsWithPopularityOnly();
    }
    // TODO: recommendation scores from data model using user._id
    return eventsWithRecScoresForUser(user);
  },
});
