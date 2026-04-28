import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from '../auth';

export const createEvent = mutation({
  args: {
    name: v.string(),
    caption: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      h3Index: v.string(),
    }),
    mediaId: v.optional(v.id('_storage')),
    tagIds: v.array(v.id('tags')),
  },
  handler: async (ctx, { name, caption, startDate, endDate, location, mediaId, tagIds }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const eventId = await ctx.db.insert('events', {
      name,
      caption,
      startDate,
      endDate,
      location,
      hostIds: [user._id],
      ...(mediaId !== undefined && { mediaId }),
    });
    await Promise.all(tagIds.map((tagId) => ctx.db.insert('eventTags', { eventId, tagId })));
    return eventId;
  },
});
