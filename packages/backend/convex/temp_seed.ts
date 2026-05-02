import { anyApi } from 'convex/server';
import { v } from 'convex/values';

import { action, ActionCtx, internalMutation, internalQuery } from './_generated/server';
import { eventSeeds } from './eventSeedsStatic';

export { eventSeeds };

async function storeSeedEventImage(ctx: ActionCtx, imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch seeded event image: ${imageUrl}`);
  }

  return await ctx.storage.store(await response.blob());
}

export const getSeedEventMediaIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const existingEvents = await ctx.db.query('events').collect();
    const mediaIdByName = new Map(
      existingEvents.map((event) => [event.name, event.mediaId ?? null])
    );

    return eventSeeds.map((event) => mediaIdByName.get(event.name) ?? null);
  },
});

export const seedData = internalMutation({
  args: {
    eventMediaIds: v.array(v.id('_storage')),
  },
  handler: async (ctx, { eventMediaIds }) => {
    if (eventMediaIds.length !== eventSeeds.length) {
      throw new Error('Expected one media id per seeded event.');
    }

    //  Users
    const userSeeds = [
      { name: 'Alice', clerkId: 'seed|alice' },
      { name: 'Bob', clerkId: 'seed|bob' },
      { name: 'Reece', clerkId: 'seed|reece' },
      { name: 'Nathan', clerkId: 'seed|nathan' },
      { name: 'Manjot', clerkId: 'seed|manjot' },
      { name: 'Daniel', clerkId: 'seed|daniel' },
      { name: 'Jonah', clerkId: 'seed|jonah' },
      { name: 'Jimmy', clerkId: 'seed|jimmy' },
      { name: 'Evan', clerkId: 'seed|evan' },
    ];
    const userIds: any[] = [];
    for (const u of userSeeds) {
      const existing = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', u.clerkId))
        .unique();
      userIds.push(
        existing?._id ??
          (await ctx.db.insert('users', {
            clerkId: u.clerkId,
            username: u.name.toLowerCase(),
            avatarUrl: '',
            bio: '',
          }))
      );
    }
    const [u1, u2, u3, u4, u5, u6, u7, u8, u9] = userIds;

    //  Tags
    const tagNames = [
      'music',
      'food',
      'study',
      'rap',
      'fair',
      'panel',
      'conference',
      'comics',
      'concert',
      'art',
      'party',
      'college',
      'vendors',
      'anime',
      'birthday',
      'chinatown',
      'wild',
      'insightful',
      'drink',
      'convention',
      'r&b',
      'chill',
      'clothes',
      'thrift',
      'culture',
      'fits',
      'games',
    ];
    const tagIds: Record<string, any> = {};
    for (const name of tagNames) {
      const existing = await ctx.db
        .query('tags')
        .withIndex('by_name', (q) => q.eq('name', name))
        .unique();
      tagIds[name] = existing?._id ?? (await ctx.db.insert('tags', { name }));
    }

    //  Events
    const eventIds: any[] = [];
    for (const [index, e] of eventSeeds.entries()) {
      const mediaId = eventMediaIds[index]!;
      const existing = await ctx.db
        .query('events')
        .filter((q) => q.eq(q.field('name'), e.name))
        .first();

      if (existing) {
        if (!existing.mediaId) {
          await ctx.db.patch(existing._id, { mediaId });
        }
        eventIds.push(existing._id);
        continue;
      }
      eventIds.push(
        await ctx.db.insert('events', {
          name: e.name,
          caption: e.description,
          mediaId,
          hostIds: [u1],
          startDate: Date.now() + 24 * 60 * 60 * 1000,
          endDate: Date.now() + 26 * 60 * 60 * 1000,
          location: e.location,
        })
      );
    }
    const [e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17] = eventIds;

    //  Attendance (the interaction signal that drives recs)
    const userEventPairs: {
      userId: any;
      eventId: any;
      status?: 'going' | 'interested' | 'uninterested';
    }[] = [
      { userId: u1, eventId: e1, status: 'going' },
      { userId: u1, eventId: e5, status: 'going' },
      { userId: u1, eventId: e4, status: 'going' },
      { userId: u1, eventId: e3, status: 'going' },
      { userId: u1, eventId: e9, status: 'going' },

      { userId: u2, eventId: e2, status: 'going' },
      { userId: u2, eventId: e7, status: 'going' },
      { userId: u2, eventId: e1, status: 'going' },
      { userId: u2, eventId: e9, status: 'going' },

      { userId: u3, eventId: e2, status: 'going' },
      { userId: u3, eventId: e4, status: 'going' },
      { userId: u3, eventId: e8, status: 'going' },
      { userId: u3, eventId: e5, status: 'going' },

      { userId: u4, eventId: e3, status: 'going' },
      { userId: u4, eventId: e8, status: 'going' },
      { userId: u4, eventId: e7, status: 'going' },
      { userId: u4, eventId: e2, status: 'going' },
      { userId: u4, eventId: e5, status: 'going' },
      { userId: u4, eventId: e9, status: 'going' },

      { userId: u5, eventId: e6, status: 'going' },
      { userId: u5, eventId: e9, status: 'going' },

      { userId: u6, eventId: e2, status: 'going' },
      { userId: u6, eventId: e7, status: 'going' },
      { userId: u6, eventId: e8, status: 'going' },
      { userId: u6, eventId: e3, status: 'going' },
      { userId: u6, eventId: e6, status: 'going' },

      { userId: u7, eventId: e9, status: 'going' },
      { userId: u7, eventId: e8, status: 'going' },
      { userId: u7, eventId: e4, status: 'going' },
      { userId: u7, eventId: e3, status: 'going' },

      { userId: u8, eventId: e2, status: 'going' },
      { userId: u8, eventId: e4, status: 'going' },
      { userId: u8, eventId: e7, status: 'going' },
      { userId: u8, eventId: e8, status: 'going' },
      { userId: u8, eventId: e1, status: 'going' },
      { userId: u8, eventId: e6, status: 'going' },
      { userId: u8, eventId: e9, status: 'going' },

      { userId: u9, eventId: e4, status: 'going' },
      { userId: u9, eventId: e6, status: 'going' },
      { userId: u9, eventId: e2, status: 'going' },
      { userId: u9, eventId: e8, status: 'going' },

      // Interested
      { userId: u1, eventId: e8, status: 'interested' },
      { userId: u1, eventId: e6, status: 'interested' },
      { userId: u2, eventId: e4, status: 'interested' },
      { userId: u2, eventId: e3, status: 'interested' },
      { userId: u3, eventId: e7, status: 'interested' },
      { userId: u3, eventId: e9, status: 'interested' },
      { userId: u4, eventId: e4, status: 'interested' },
      { userId: u4, eventId: e6, status: 'interested' },
      { userId: u5, eventId: e2, status: 'interested' },
      { userId: u5, eventId: e4, status: 'interested' },
      { userId: u6, eventId: e4, status: 'interested' },
      { userId: u6, eventId: e9, status: 'interested' },
      { userId: u7, eventId: e6, status: 'interested' },
      { userId: u7, eventId: e2, status: 'interested' },
      { userId: u8, eventId: e5, status: 'interested' },
      { userId: u8, eventId: e3, status: 'interested' },
      { userId: u9, eventId: e7, status: 'interested' },
      { userId: u9, eventId: e3, status: 'interested' },

      // Uninterested
      { userId: u1, eventId: e2, status: 'uninterested' },
      { userId: u1, eventId: e7, status: 'uninterested' },
      { userId: u2, eventId: e6, status: 'uninterested' },
      { userId: u2, eventId: e5, status: 'uninterested' },
      { userId: u3, eventId: e3, status: 'uninterested' },
      { userId: u3, eventId: e6, status: 'uninterested' },
      { userId: u4, eventId: e1, status: 'uninterested' },
      { userId: u4, eventId: e5, status: 'uninterested' },
      { userId: u5, eventId: e3, status: 'uninterested' },
      { userId: u5, eventId: e1, status: 'uninterested' },
      { userId: u6, eventId: e1, status: 'uninterested' },
      { userId: u6, eventId: e5, status: 'uninterested' },
      { userId: u7, eventId: e2, status: 'uninterested' },
      { userId: u7, eventId: e7, status: 'uninterested' },
      { userId: u8, eventId: e3, status: 'uninterested' },
      { userId: u8, eventId: e6, status: 'uninterested' },
      { userId: u9, eventId: e1, status: 'uninterested' },
      { userId: u9, eventId: e5, status: 'uninterested' },
    ];
    for (const pair of userEventPairs) {
      const existing = await ctx.db
        .query('attendance')
        .withIndex('by_user_event', (q) => q.eq('userId', pair.userId).eq('eventId', pair.eventId))
        .unique();
      if (!existing) await ctx.db.insert('attendance', pair);
    }

    //  Event Tags (the content signal that drives recs)
    const eventTagPairs = [
      { eventId: e1, tagId: tagIds['study'] },
      { eventId: e1, tagId: tagIds['food'] },
      { eventId: e2, tagId: tagIds['concert'] },
      { eventId: e2, tagId: tagIds['music'] },
      { eventId: e2, tagId: tagIds['rap'] },
      { eventId: e3, tagId: tagIds['college'] },
      { eventId: e3, tagId: tagIds['party'] },
      { eventId: e4, tagId: tagIds['food'] },
      { eventId: e4, tagId: tagIds['music'] },
      { eventId: e4, tagId: tagIds['art'] },
      { eventId: e4, tagId: tagIds['vendors'] },
      { eventId: e5, tagId: tagIds['panel'] },
      { eventId: e5, tagId: tagIds['conference'] },
      { eventId: e5, tagId: tagIds['music'] },
      { eventId: e6, tagId: tagIds['anime'] },
      { eventId: e6, tagId: tagIds['games'] },
      { eventId: e6, tagId: tagIds['comics'] },
      { eventId: e6, tagId: tagIds['vendors'] },
      { eventId: e6, tagId: tagIds['convention'] },
      { eventId: e7, tagId: tagIds['concert'] },
      { eventId: e7, tagId: tagIds['rap'] },
      { eventId: e7, tagId: tagIds['r&b'] },
      { eventId: e7, tagId: tagIds['music'] },
      { eventId: e8, tagId: tagIds['chill'] },
      { eventId: e8, tagId: tagIds['music'] },
      { eventId: e9, tagId: tagIds['clothes'] },
      { eventId: e9, tagId: tagIds['culture'] },
      { eventId: e9, tagId: tagIds['fits'] },
      { eventId: e9, tagId: tagIds['thrift'] },

      { eventId: e10, tagId: tagIds['chinatown'] },
      { eventId: e10, tagId: tagIds['culture'] },
      { eventId: e10, tagId: tagIds['food'] },
      { eventId: e10, tagId: tagIds['vendors'] },
      { eventId: e10, tagId: tagIds['music'] },

      { eventId: e11, tagId: tagIds['college'] },
      { eventId: e11, tagId: tagIds['fair'] },
      { eventId: e11, tagId: tagIds['insightful'] },
      { eventId: e11, tagId: tagIds['study'] },
      { eventId: e11, tagId: tagIds['vendors'] },

      { eventId: e12, tagId: tagIds['fits'] },
      { eventId: e12, tagId: tagIds['clothes'] },
      { eventId: e12, tagId: tagIds['thrift'] },
      { eventId: e12, tagId: tagIds['vendors'] },
      { eventId: e12, tagId: tagIds['culture'] },

      { eventId: e13, tagId: tagIds['rap'] },
      { eventId: e13, tagId: tagIds['wild'] },
      { eventId: e13, tagId: tagIds['music'] },
      { eventId: e13, tagId: tagIds['party'] },
      { eventId: e13, tagId: tagIds['college'] },

      { eventId: e14, tagId: tagIds['art'] },
      { eventId: e14, tagId: tagIds['culture'] },
      { eventId: e14, tagId: tagIds['insightful'] },
      { eventId: e14, tagId: tagIds['fair'] },

      { eventId: e15, tagId: tagIds['chill'] },
      { eventId: e15, tagId: tagIds['r&b'] },
      { eventId: e15, tagId: tagIds['food'] },
      { eventId: e15, tagId: tagIds['music'] },
      { eventId: e15, tagId: tagIds['drink'] },

      { eventId: e16, tagId: tagIds['birthday'] },
      { eventId: e16, tagId: tagIds['party'] },
      { eventId: e16, tagId: tagIds['wild'] },
      { eventId: e16, tagId: tagIds['drink'] },
      { eventId: e16, tagId: tagIds['music'] },

      { eventId: e17, tagId: tagIds['anime'] },
      { eventId: e17, tagId: tagIds['comics'] },
      { eventId: e17, tagId: tagIds['college'] },
      { eventId: e17, tagId: tagIds['chill'] },
    ];
    for (const pair of eventTagPairs) {
      const existing = await ctx.db
        .query('eventTags')
        .withIndex('by_event_tag', (q) => q.eq('eventId', pair.eventId).eq('tagId', pair.tagId))
        .unique();
      if (!existing) await ctx.db.insert('eventTags', pair);
    }

    //  Per-user preferred tag names (single source of truth for both
    //  userTagPreferences and userTagWeights cold-start values).
    const userPreferredTagNames: { userId: any; preferred: string[] }[] = [
      { userId: u1, preferred: ['study', 'food', 'culture', 'college', 'insightful'] },
      { userId: u2, preferred: ['music', 'concert', 'rap', 'r&b', 'chill'] },
      { userId: u3, preferred: ['music', 'art', 'culture', 'concert', 'food'] },
      { userId: u4, preferred: ['party', 'college', 'chill', 'drink', 'wild'] },
      { userId: u5, preferred: ['anime', 'games', 'comics', 'convention', 'vendors'] },
      { userId: u6, preferred: ['music', 'concert', 'rap', 'r&b', 'wild'] },
      { userId: u7, preferred: ['thrift', 'fits', 'clothes', 'chill', 'culture'] },
      { userId: u8, preferred: ['music', 'concert', 'art', 'food', 'culture'] },
      { userId: u9, preferred: ['art', 'music', 'anime', 'comics', 'food'] },
    ];

    //  userTagPreferences (read by getPreferredTagsByUserId)
    for (const entry of userPreferredTagNames) {
      const existing = await ctx.db
        .query('userTagPreferences')
        .withIndex('by_userId', (q) => q.eq('userId', entry.userId))
        .unique();
      if (existing) continue;

      const tagIdList = entry.preferred
        .map((name) => tagIds[name])
        .filter((id): id is NonNullable<typeof id> => id !== undefined);

      await ctx.db.insert('userTagPreferences', {
        userId: entry.userId,
        tags: tagIdList,
        updatedAt: Date.now(),
      });
    }

    //  userTagWeights (cold-start: 1.0 at preferred tag indices, 0.0 elsewhere)
    const NUM_TAGS = tagNames.length;
    const tagIndex: Record<string, number> = {};
    tagNames.forEach((name, i) => {
      tagIndex[name] = i;
    });

    const buildColdStartWeights = (preferredTagNames: string[]): number[] => {
      const weights = new Array(NUM_TAGS).fill(0);
      for (const name of preferredTagNames) {
        const idx = tagIndex[name];
        if (idx !== undefined) weights[idx] = 1;
      }
      return weights;
    };

    for (const entry of userPreferredTagNames) {
      const existing = await ctx.db
        .query('userTagWeights')
        .withIndex('by_userId', (q) => q.eq('userId', entry.userId))
        .unique();
      if (existing) continue;

      await ctx.db.insert('userTagWeights', {
        userId: entry.userId,
        weights: buildColdStartWeights(entry.preferred),
        updatedAt: Date.now(),
      });
    }

    return {
      users: userIds,
      events: eventIds,
      tags: tagIds,
    };
  },
});

export const seed = action({
  args: {},
  handler: async (ctx) => {
    const existingMediaIds = await ctx.runQuery(anyApi.temp_seed.getSeedEventMediaIds, {});
    const eventMediaIds = await Promise.all(
      eventSeeds.map(async (event, index) => {
        return existingMediaIds[index] ?? (await storeSeedEventImage(ctx, event.imageUrl));
      })
    );

    return await ctx.runMutation(anyApi.temp_seed.seedData, {
      eventMediaIds,
    });
  },
});
