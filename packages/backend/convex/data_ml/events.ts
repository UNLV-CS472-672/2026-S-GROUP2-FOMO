import { v } from 'convex/values';
import { latLngToCell } from 'h3-js';

import type { Doc } from '../_generated/dataModel';
import { query } from '../_generated/server';
import { __backend_only_guestOrAuthenticatedUser } from '../auth';
import { eventSeeds } from '../seed';

// TODO: Remove mock-event helpers and seed-based implementations once events are loaded from
// `ctx.db` (and external sources). `mockEventIdForSeedIndex` / `mock:event:*` ids are temporary.

/** Stable id for mock / seeded list events until we load real `events` documents. */
export function mockEventIdForSeedIndex(index: number): string {
  return `mock:event:${index}`;
}

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

// TODO: Delete; replace with a real query over `events` (and popularity) for guest browse.
function eventsWithPopularityOnly() {
  const mock_events = eventSeeds;
  return mock_events.map((event, i) => ({
    ...event,
    id: mockEventIdForSeedIndex(i),
    attendeeCount: i * 100,
  }));
}

// TODO: Delete; replace with DB + recommendation pipeline using `user._id`.
function eventsWithRecScoresForUser(_user: Doc<'users'>) {
  const mock_events = eventSeeds;
  return mock_events.map((event, i) => ({
    ...event,
    id: mockEventIdForSeedIndex(i),
    attendeeCount: i * 100,
    recommendationScore: 1.0 / i,
  }));
}

// TODO: Retain this public API, but reimplement handlers to use persisted events instead of seeds.
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

// TODO: Keep query shape; drop `mock:event:*` parsing once clients use real `Id<'events'>`.
export const getEventById = query({
  args: { eventId: v.string() },
  handler: async (_ctx, { eventId }) => {
    // TODO: `eventId` → `Id<'events'>` + `ctx.db.get`; enrich from Ticketmaster / internal fields as needed.
    const match = /^mock:event:(\d+)$/.exec(eventId);
    if (!match) {
      return null;
    }
    const index = Number(match[1]);
    if (!Number.isInteger(index) || index < 0 || index >= eventSeeds.length) {
      return null;
    }
    const event = eventSeeds[index]!;
    return {
      id: eventId,
      name: event.name,
      organization: event.organization,
      description: event.description,
      location: event.location,
      attendeeCount: index * 100,
      imageIndex: index % 4,
    };
  },
});
