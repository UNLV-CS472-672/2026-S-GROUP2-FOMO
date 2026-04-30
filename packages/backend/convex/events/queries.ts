import { v } from 'convex/values';
import { query } from '../_generated/server';
import { __backend_only_guestOrAuthenticatedUser } from '../auth';
import {
  getEventRecIdsForUser,
  recommendationScoresFromRecIds,
  serializeEvent,
  serializeEventFeedPost,
} from './utils';

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

export const getTopMediaPosts = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const [viewer, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);

    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect();

    const topPosts = posts
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
          authorName: author?.displayName || author?.username || 'Unknown user',
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
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .order('desc')
      .collect();

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
