import { latLngToCell } from 'h3-js';

import type { Doc, Id } from '../_generated/dataModel';
import type { QueryCtx } from '../_generated/server';
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

export async function getEventRecIdsForUser(
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<Id<'events'>[]> {
  const row = await ctx.db
    .query('eventRecs')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first();

  return row?.eventIds ?? [];
}

export function recommendationScoresFromRecIds(
  eventIds: Id<'events'>[]
): Map<Id<'events'>, number> {
  return new Map(eventIds.map((eventId, index) => [eventId, 1 / (index + 1)] as const));
}

export async function serializeEvent(
  ctx: QueryCtx,
  event: Doc<'events'>,
  recommendationScore?: number
) {
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

export async function serializeEventFeedPost(
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
