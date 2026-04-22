import { latLngToCell } from 'h3-js';

import { v } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import { query, type QueryCtx } from '../_generated/server';
import { __backend_only_guestOrAuthenticatedUser } from '../auth';
import { getAttendeeCount } from './attendance';

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
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) {
      return null;
    }

    return await serializeEvent(ctx, event);
  },
});

export const getTopMediaPosts = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect();

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const mediaIds = Array.isArray(post.mediaIds)
          ? post.mediaIds
          : post.mediaIds
            ? [post.mediaIds]
            : [];

        if (!mediaIds.length) {
          return null;
        }

        const author = await ctx.db.get(post.authorId);
        return {
          id: post._id,
          caption: post.caption ?? '',
          mediaId: mediaIds[0] ?? null,
          likeCount: post.likeCount ?? 0,
          matchedTagCount: 0,
          creationTime: post._creationTime,
          authorName: author?.displayName || author?.username || 'Unknown user',
        };
      })
    );

    return postsWithAuthors
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .sort((a, b) => b.likeCount - a.likeCount || b.creationTime - a.creationTime)
      .slice(0, 3);
  },
});
