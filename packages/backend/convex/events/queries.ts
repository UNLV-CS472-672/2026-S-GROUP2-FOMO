import { v } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import { query, type QueryCtx } from '../_generated/server';
import { __backend_only_guestOrAuthenticatedUser } from '../auth';
import { getHiddenUserIds } from '../moderation/block';
import { getHiddenPostIds } from '../moderation/report';
import { getDisplayNameForUser } from '../user_identity';
import { getAttendeeCount } from './attendance';
import {
  getEventRecIdsForUser,
  recommendationScoresFromRecIds,
  serializeEvent,
  serializeEventFeedPost,
} from './utils';

export { latLngToH3Index } from './utils';

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

export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const [viewer, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);
    const events = await ctx.db.query('events').withIndex('by_startDate').collect();

    const shouldLoadRecommendations = !guestMode && viewer !== null;
    const scoreByEventId = shouldLoadRecommendations
      ? recommendationScoresFromRecIds(await getEventRecIdsForUser(ctx, viewer._id))
      : undefined;

    return await Promise.all(
      events.map((event) => serializeEvent(ctx, event, scoreByEventId?.get(event._id)))
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

export const getExternalEvents = query({
  args: {},
  handler: async (ctx) => {
    const [, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);

    const events = await ctx.db.query('externalEvents').withIndex('by_startDate').collect();
    return await Promise.all(
      events.map((event, index) =>
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

export const getTopMediaPosts = query({
  args: { eventId: v.id('events') },
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
        // check if the view has liked the post
        const [author, like] = await Promise.all([
          ctx.db.get(post.authorId),
          guestMode
            ? Promise.resolve(null)
            : ctx.db
                .query('likes')
                .withIndex('by_userId_postId', (q) =>
                  q.eq('userId', viewer._id).eq('postId', post._id)
                )
                .unique(),
        ]);

        return {
          id: post._id,
          caption: post.caption ?? '',
          mediaIds: post.mediaIds,
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
    eventId: v.id('events'),
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
