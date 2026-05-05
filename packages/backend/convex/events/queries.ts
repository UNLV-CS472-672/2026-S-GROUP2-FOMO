import { latLngToCell } from 'h3-js';

import { v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import { query, type QueryCtx } from '../_generated/server';
import {
  __backend_only_getAndAuthenticateCurrentConvexUser,
  __backend_only_guestOrAuthenticatedUser,
} from '../auth';
import { getThreadedCommentsByPost } from '../comments';
import { serializeStorageFile, serializeStorageFiles } from '../files';
import { getHiddenUserIds } from '../moderation/block';
import { getHiddenPostIds } from '../moderation/report';
import { getAvatarUrlForUser, getDisplayNameForUser, getUsernameForUser } from '../user_identity';
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
  const [attendeeCount, eventTagLinks, mediaFile] = await Promise.all([
    getAttendeeCount(ctx, event._id),
    ctx.db
      .query('eventTags')
      .withIndex('by_event', (q) => q.eq('eventId', event._id))
      .collect(),
    event.mediaId ? serializeStorageFile(ctx, event.mediaId) : Promise.resolve(null),
  ]);

  const tags = await Promise.all(eventTagLinks.map(async (link) => await ctx.db.get(link.tagId)));

  return {
    id: event._id,
    name: event.name,
    caption: event.caption,
    tags: tags.flatMap((tag) => (tag ? [tag.name] : [])),
    location: event.location,
    attendeeCount,
    startDate: event.startDate,
    endDate: event.endDate,
    mediaId: event.mediaId ?? null,
    mediaUrl: mediaFile?.url ?? null,
    hostIds: event.hostIds,
    recommendationScore,
  };
}

async function serializeExternalEvent(
  ctx: QueryCtx,
  event: Doc<'externalEvents'>,
  recommendationScore?: number
) {
  const attendeeCount = await getAttendeeCount(ctx, event._id);

  return {
    id: event._id,
    externalKey: event.externalKey,
    name: event.name,
    caption: event.caption,
    organization: event.organization,
    tags: [],
    location: event.location,
    attendeeCount,
    startDate: event.startDate,
    endDate: event.endDate,
    mediaId: null,
    hostIds: [],
    recommendationScore,
  };
}

async function serializeEventFeedPost(
  ctx: QueryCtx,
  post: Doc<'posts'>,
  viewerId?: Doc<'users'>['_id']
) {
  const mediaIds = post.mediaIds ?? [];

  const [author, comments, likes, event, mediaFiles] = await Promise.all([
    ctx.db.get(post.authorId),
    getThreadedCommentsByPost(ctx, post._id),
    ctx.db
      .query('likes')
      .withIndex('by_postId', (q) => q.eq('postId', post._id))
      .collect(),
    post.eventId
      ? ctx.db.get(post.eventId as Id<'events'> | Id<'externalEvents'>)
      : Promise.resolve(null),
    serializeStorageFiles(ctx, mediaIds),
  ]);

  return {
    id: post._id,
    caption: post.caption ?? '',
    creationTime: post._creationTime,
    authorId: post.authorId,
    authorName: getDisplayNameForUser(author),
    authorUsername: getUsernameForUser(author),
    authorAvatarUrl: getAvatarUrlForUser(author),
    likes: post.likeCount ?? likes.length,
    liked: viewerId ? likes.some((like) => like.userId === viewerId) : false,
    mediaIds,
    mediaFiles,
    eventId: post.eventId ?? null,
    eventName: event?.name ?? '',
    commentCount: countComments(comments),
    comments,
  };
}

function countComments(comments: Awaited<ReturnType<typeof getThreadedCommentsByPost>>): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}

// Internal events starting within this window show on the map even before they begin.
const UPCOMING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// An ended internal event stays visible as long as a post was added within this window.
const POST_ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;
// External (Ticketmaster) events show up to this far in advance.
const UPCOMING_EXTERNAL_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const [, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);

    const now = Date.now();

    // Query 1: active + upcoming events (haven't ended yet, starting within 7 days).
    const activeAndUpcoming = (
      await ctx.db
        .query('events')
        .withIndex('by_endDate', (q) => q.gte('endDate', now))
        .collect()
    ).filter((e) => e.startDate <= now + UPCOMING_WINDOW_MS);

    // Query 2: ended events where someone posted in the last 24h — these stay
    // on the map as long as activity continues, regardless of how long ago they ended.
    const recentlyPosted = (
      await ctx.db
        .query('events')
        .withIndex('by_lastPostAt', (q) => q.gte('lastPostAt', now - POST_ACTIVITY_WINDOW_MS))
        .collect()
    ).filter((e) => e.endDate < now);

    // Merge, deduplicating by ID (an active event with recent posts appears in both).
    const seen = new Set<string>();
    const merged: Doc<'events'>[] = [];
    for (const e of [...activeAndUpcoming, ...recentlyPosted]) {
      if (!seen.has(e._id)) {
        seen.add(e._id);
        merged.push(e);
      }
    }

    return await Promise.all(
      merged.map((event, index) =>
        serializeEvent(ctx, event, guestMode ? undefined : 1 / (index + 1))
      )
    );
  },
});

export const getAnyEventById = query({
  args: { eventId: v.union(v.id('events'), v.id('externalEvents')) },
  handler: async (ctx, { eventId }) => {
    // ctx.db.get resolves the correct table from the ID prefix at runtime.
    const doc = await ctx.db.get(eventId as Id<'events'>);
    if (!doc) return null;
    if ('externalKey' in doc) {
      const external = doc as unknown as Doc<'externalEvents'>;
      return {
        ...(await serializeExternalEvent(ctx, external)),
        isExternal: true as const,
        organization: external.organization,
      };
    }
    return { ...(await serializeEvent(ctx, doc)), isExternal: false as const, organization: null };
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

// Unfiltered list of internal events for surfaces (e.g. the create-post search)
// where users need to attach posts to past events too.
export const getAllInternalEvents = query({
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

export const getExternalEvents = query({
  args: {},
  handler: async (ctx) => {
    const [, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);

    const now = Date.now();

    // Query 1: active + upcoming external events (within 3 days).
    const activeAndUpcoming = (
      await ctx.db
        .query('externalEvents')
        .withIndex('by_endDate', (q) => q.gte('endDate', now))
        .collect()
    ).filter((e) => e.startDate <= now + UPCOMING_EXTERNAL_WINDOW_MS);

    // Query 2: ended external events with post activity in the last 24h.
    const recentlyPosted = (
      await ctx.db
        .query('externalEvents')
        .withIndex('by_lastPostAt', (q) => q.gte('lastPostAt', now - POST_ACTIVITY_WINDOW_MS))
        .collect()
    ).filter((e) => e.endDate < now);

    const seen = new Set<string>();
    const merged: Doc<'externalEvents'>[] = [];
    for (const e of [...activeAndUpcoming, ...recentlyPosted]) {
      if (!seen.has(e._id)) {
        seen.add(e._id);
        merged.push(e);
      }
    }

    return await Promise.all(
      merged.map((event, index) =>
        serializeExternalEvent(ctx, event, guestMode ? undefined : 1 / (index + 1))
      )
    );
  },
});

export const getExternalEventsById = query({
  args: { eventId: v.id('externalEvents') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) {
      return null;
    }

    return await serializeExternalEvent(ctx, event);
  },
});

export const getAttendedPastEvents = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);

    const now = Date.now();
    const attendanceRecords = await ctx.db
      .query('attendance')
      .withIndex('by_userId', (q) => q.eq('userId', viewer._id))
      .collect();

    const goingEventIds = attendanceRecords
      .filter((r) => r.status === 'going')
      .map((r) => r.eventId);

    const events = await Promise.all(goingEventIds.map((id) => ctx.db.get(id)));

    const pastEvents = events
      .filter((e): e is NonNullable<typeof e> => e !== null && e.endDate < now)
      .sort((a, b) => b.endDate - a.endDate);

    return pastEvents.map((event) => ({
      id: event._id,
      name: event.name,
      caption: event.caption,
      organization: 'organization' in event ? event.organization : null,
      startDate: event.startDate,
      endDate: event.endDate,
      mediaId: 'mediaId' in event ? (event.mediaId ?? null) : null,
      isExternal: 'externalKey' in event,
    }));
  },
});

export const getTopMediaPosts = query({
  args: { eventId: v.union(v.id('events'), v.id('externalEvents')) },
  handler: async (ctx, { eventId }) => {
    const [viewer, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);
    const [blockedUserIds, hiddenPostIds] = guestMode
      ? [new Set(), new Set()]
      : await Promise.all([getHiddenUserIds(ctx, viewer._id), getHiddenPostIds(ctx, viewer._id)]);

    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect();

    const topPosts = posts
      .filter((post) => !blockedUserIds.has(post.authorId))
      .filter((post) => !hiddenPostIds.has(post._id))
      .filter((post) => (post.mediaIds?.length ?? 0) > 0)
      .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0) || b._creationTime - a._creationTime)
      .slice(0, 3);

    return await Promise.all(
      topPosts.map(async (post) => {
        const [author, like, thumbnailFile] = await Promise.all([
          ctx.db.get(post.authorId),
          guestMode
            ? Promise.resolve(null)
            : ctx.db
                .query('likes')
                .withIndex('by_userId_postId', (q) =>
                  q.eq('userId', viewer._id).eq('postId', post._id)
                )
                .unique(),
          post.mediaIds?.[0] != null
            ? serializeStorageFile(ctx, post.mediaIds[0])
            : Promise.resolve(null),
        ]);

        return {
          id: post._id,
          caption: post.caption ?? '',
          mediaIds: post.mediaIds,
          thumbnailFile,
          likeCount: post.likeCount ?? 0,
          liked: like !== null,
          matchedTagCount: 0,
          creationTime: post._creationTime,
          authorName: getDisplayNameForUser(author),
        };
      })
    );
  },
});

export const getEventFeed = query({
  args: {
    eventId: v.union(v.id('events'), v.id('externalEvents')),
    sortBy: v.optional(v.literal('popular')),
    mediaOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { eventId, sortBy, mediaOnly }) => {
    const [viewer, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);
    const [blockedUserIds, hiddenPostIds] = guestMode
      ? [new Set(), new Set()]
      : await Promise.all([getHiddenUserIds(ctx, viewer._id), getHiddenPostIds(ctx, viewer._id)]);
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .order('desc')
      .collect();

    posts.splice(0, posts.length, ...posts.filter((post) => !blockedUserIds.has(post.authorId)));
    posts.splice(0, posts.length, ...posts.filter((post) => !hiddenPostIds.has(post._id)));

    if (mediaOnly) {
      posts.splice(0, posts.length, ...posts.filter((post) => (post.mediaIds?.length ?? 0) > 0));
    }

    const serialized = await Promise.all(
      posts.map((post) => serializeEventFeedPost(ctx, post, guestMode ? undefined : viewer._id))
    );

    if (sortBy === 'popular') {
      serialized.sort((a, b) => b.likes - a.likes);
    }

    return serialized;
  },
});
