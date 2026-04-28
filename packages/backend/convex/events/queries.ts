import { latLngToCell } from 'h3-js';

import { v } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import { query, type QueryCtx } from '../_generated/server';
import { __backend_only_guestOrAuthenticatedUser } from '../auth';
import { getThreadedCommentsByPost } from '../comments';
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
  const [attendeeCount, eventTagLinks] = await Promise.all([
    getAttendeeCount(ctx, event._id),
    ctx.db
      .query('eventTags')
      .withIndex('by_event', (q) => q.eq('eventId', event._id))
      .collect(),
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
    hostIds: event.hostIds,
    recommendationScore,
  };
}

async function serializeEventFeedPost(
  ctx: QueryCtx,
  post: Doc<'posts'>,
  viewerId?: Doc<'users'>['_id']
) {
  const mediaIds = post.mediaIds ?? [];

  const [author, comments, likes, event] = await Promise.all([
    ctx.db.get(post.authorId),
    getThreadedCommentsByPost(ctx, post._id),
    ctx.db
      .query('likes')
      .withIndex('by_postId', (q) => q.eq('postId', post._id))
      .collect(),
    post.eventId ? ctx.db.get(post.eventId) : Promise.resolve(null),
  ]);

  return {
    id: post._id,
    caption: post.caption ?? '',
    creationTime: post._creationTime,
    authorName: author?.displayName || author?.username || 'Unknown user',
    authorUsername: author?.username ?? '',
    authorAvatarUrl: author?.avatarUrl || '',
    likes: post.likeCount ?? likes.length,
    liked: viewerId ? likes.some((like) => like.userId === viewerId) : false,
    mediaIds,
    eventId: post.eventId ?? null,
    eventName: event?.name ?? '',
    commentCount: countComments(comments),
    comments,
  };
}

function countComments(comments: Awaited<ReturnType<typeof getThreadedCommentsByPost>>): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
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
