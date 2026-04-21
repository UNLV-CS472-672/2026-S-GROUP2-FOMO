import { v } from 'convex/values';
import { query } from './_generated/server';

export const getEventById = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) return null;

    return {
      id: eventId,
      name: event.name,
      caption: event.caption,
      mediaId: event.mediaId,
      hostIds: event.hostIds,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
    };
  },
});
