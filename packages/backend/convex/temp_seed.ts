import { anyApi } from 'convex/server';
import { v } from 'convex/values';

import { action, ActionCtx, internalMutation, internalQuery } from './_generated/server';
import { eventSeeds } from './eventSeedsStatic';

export { eventSeeds };

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Returns the ms timestamp for the next occurrence of a given weekday + hour
 * from `baseMs`. weekday: 0=Mon, 6=Sun. hour: 0-23 (UTC).
 */
function nextDayAndHour(baseMs: number, weekday: number, hour: number): number {
  const d = new Date(baseMs);
  const currentDay = (d.getUTCDay() + 6) % 7; // JS Sun=0 -> Mon=0..Sun=6
  let daysAhead = weekday - currentDay;
  if (daysAhead <= 0) daysAhead += 7;

  const target = new Date(baseMs);
  target.setUTCDate(target.getUTCDate() + daysAhead);
  target.setUTCHours(hour, 0, 0, 0);
  return target.getTime();
}

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

    const now = Date.now();

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

    // ----------------------------------------------------------------
    //  Events pinned to specific weekdays + time-of-day (UTC)
    //
    //  Day: Mon=0..Sun=6
    //  Time buckets (reranker uses these):
    //    morning=9(6-11) noon=12(11-14) afternoon=15(14-17)
    //    evening=19(17-21) late_night=22(21-6)
    //
    //  User temporal patterns (from attendance below):
    //    Alice:  Fri evening + Sat afternoon/evening
    //    Bob:    Fri/Sat late_night
    //    Nathan: Wed/Thu evening
    //    Jimmy:  morning + noon (weekend daytime)
    // ----------------------------------------------------------------
    const eventSchedules: { weekday: number; hour: number }[] = [
      { weekday: 2, hour: 9 }, // e1  Coffee+Homework        Wed morning
      { weekday: 4, hour: 22 }, // e2  ASAP Rocky Concert      Fri late_night
      { weekday: 5, hour: 22 }, // e3  Psi Rho house party     Sat late_night
      { weekday: 4, hour: 19 }, // e4  First Friday            Fri evening
      { weekday: 3, hour: 15 }, // e5  St. Jimmy Panel         Thu afternoon
      { weekday: 5, hour: 12 }, // e6  LVL UP EXPO             Sat noon
      { weekday: 4, hour: 21 }, // e7  Baby Keem Concert       Fri late_night
      { weekday: 5, hour: 19 }, // e8  Water Lantern Fest      Sat evening
      { weekday: 6, hour: 10 }, // e9  Thrift Valley           Sun morning
      { weekday: 4, hour: 19 }, // e10 Chinatown Night Market  Fri evening
      { weekday: 1, hour: 9 }, // e11 UNLV Career Fair        Tue morning
      { weekday: 5, hour: 15 }, // e12 Vegas Streetwear        Sat afternoon
      { weekday: 5, hour: 22 }, // e13 Desert Rap Cypher       Sat late_night
      { weekday: 3, hour: 19 }, // e14 Downtown Art Walk       Thu evening
      { weekday: 4, hour: 19 }, // e15 Sunset Chill Fest       Fri evening  (fresh)
      { weekday: 5, hour: 22 }, // e16 Neon Birthday Bash      Sat late_night (fresh)
      { weekday: 2, hour: 19 }, // e17 UNLV Anime Club         Wed evening
    ];

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

      const schedule = eventSchedules[index] ?? { weekday: 5, hour: 19 };
      const weeksOut = index < 6 ? 1 : index < 12 ? 2 : 3;
      const startMs = nextDayAndHour(now + weeksOut * 7 * DAY, schedule.weekday, schedule.hour);

      eventIds.push(
        await ctx.db.insert('events', {
          name: e.name,
          caption: e.description,
          mediaId,
          hostIds: [u1],
          startDate: startMs,
          endDate: startMs + 4 * HOUR,
          location: e.location,
        })
      );
    }
    const [e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17] = eventIds;

    //  Friendships
    const friendPairs: { requesterId: any; recipientId: any }[] = [
      { requesterId: u1, recipientId: u2 },
      { requesterId: u1, recipientId: u3 },
      { requesterId: u4, recipientId: u6 },
      { requesterId: u4, recipientId: u7 },
      { requesterId: u8, recipientId: u9 },
      { requesterId: u2, recipientId: u6 },
      { requesterId: u3, recipientId: u7 },
    ];
    for (const pair of friendPairs) {
      const existing = await ctx.db
        .query('friends')
        .withIndex('by_recipientId_requesterId', (q) =>
          q.eq('recipientId', pair.recipientId).eq('requesterId', pair.requesterId)
        )
        .first();
      if (!existing) {
        await ctx.db.insert('friends', { ...pair, status: 'accepted' });
      }
    }

    // ----------------------------------------------------------------
    //  Attendance — shaped so users build clear temporal profiles.
    //
    //  Alice  → Fri eve, Sat eve/aft  (should boost e10,e15 Fri eve)
    //  Bob    → Fri/Sat late_night    (should boost e13,e16 Sat late)
    //  Nathan → Wed/Thu evening       (should boost e14 Thu eve, e17 Wed eve)
    //  Jimmy  → morning + noon        (should boost e11 Tue morn, e9 Sun morn)
    // ----------------------------------------------------------------
    const userEventPairs: {
      userId: any;
      eventId: any;
      status?: 'going' | 'interested' | 'uninterested';
    }[] = [
      // Alice — Fri evening + Sat afternoon/evening
      { userId: u1, eventId: e4, status: 'going' },
      { userId: u1, eventId: e8, status: 'going' },
      { userId: u1, eventId: e12, status: 'going' },
      { userId: u1, eventId: e10, status: 'going' },
      { userId: u1, eventId: e9, status: 'going' },

      // Bob — Fri/Sat late_night
      { userId: u2, eventId: e2, status: 'going' },
      { userId: u2, eventId: e7, status: 'going' },
      { userId: u2, eventId: e3, status: 'going' },
      { userId: u2, eventId: e13, status: 'going' },

      // Reece — Sat events
      { userId: u3, eventId: e8, status: 'going' },
      { userId: u3, eventId: e6, status: 'going' },
      { userId: u3, eventId: e12, status: 'going' },
      { userId: u3, eventId: e4, status: 'going' },

      // Nathan — Wed/Thu evening
      { userId: u4, eventId: e14, status: 'going' },
      { userId: u4, eventId: e17, status: 'going' },
      { userId: u4, eventId: e1, status: 'going' },
      { userId: u4, eventId: e5, status: 'going' },

      // Manjot — sparse
      { userId: u5, eventId: e6, status: 'going' },
      { userId: u5, eventId: e17, status: 'going' },

      // Daniel — Fri/Sat nightlife
      { userId: u6, eventId: e2, status: 'going' },
      { userId: u6, eventId: e3, status: 'going' },
      { userId: u6, eventId: e7, status: 'going' },
      { userId: u6, eventId: e8, status: 'going' },

      // Jonah — Sat afternoon/evening
      { userId: u7, eventId: e12, status: 'going' },
      { userId: u7, eventId: e8, status: 'going' },
      { userId: u7, eventId: e6, status: 'going' },
      { userId: u7, eventId: e9, status: 'going' },

      // Jimmy — morning + noon (weekend daytime)
      { userId: u8, eventId: e6, status: 'going' },
      { userId: u8, eventId: e9, status: 'going' },
      { userId: u8, eventId: e1, status: 'going' },
      { userId: u8, eventId: e11, status: 'going' },

      // Evan — afternoon + evening
      { userId: u9, eventId: e5, status: 'going' },
      { userId: u9, eventId: e14, status: 'going' },
      { userId: u9, eventId: e4, status: 'going' },
      { userId: u9, eventId: e12, status: 'going' },

      // Interested
      { userId: u1, eventId: e15, status: 'interested' },
      { userId: u1, eventId: e6, status: 'interested' },
      { userId: u2, eventId: e16, status: 'interested' },
      { userId: u2, eventId: e13, status: 'interested' },
      { userId: u3, eventId: e3, status: 'interested' },
      { userId: u3, eventId: e13, status: 'interested' },
      { userId: u4, eventId: e4, status: 'interested' },
      { userId: u4, eventId: e8, status: 'interested' },
      { userId: u5, eventId: e12, status: 'interested' },
      { userId: u5, eventId: e9, status: 'interested' },
      { userId: u6, eventId: e16, status: 'interested' },
      { userId: u6, eventId: e13, status: 'interested' },
      { userId: u7, eventId: e4, status: 'interested' },
      { userId: u7, eventId: e15, status: 'interested' },
      { userId: u8, eventId: e5, status: 'interested' },
      { userId: u8, eventId: e12, status: 'interested' },
      { userId: u9, eventId: e8, status: 'interested' },
      { userId: u9, eventId: e17, status: 'interested' },

      // Uninterested
      { userId: u1, eventId: e2, status: 'uninterested' },
      { userId: u1, eventId: e1, status: 'uninterested' },
      { userId: u2, eventId: e6, status: 'uninterested' },
      { userId: u2, eventId: e1, status: 'uninterested' },
      { userId: u3, eventId: e1, status: 'uninterested' },
      { userId: u3, eventId: e11, status: 'uninterested' },
      { userId: u4, eventId: e3, status: 'uninterested' },
      { userId: u4, eventId: e2, status: 'uninterested' },
      { userId: u5, eventId: e3, status: 'uninterested' },
      { userId: u5, eventId: e2, status: 'uninterested' },
      { userId: u6, eventId: e1, status: 'uninterested' },
      { userId: u6, eventId: e11, status: 'uninterested' },
      { userId: u7, eventId: e2, status: 'uninterested' },
      { userId: u7, eventId: e3, status: 'uninterested' },
      { userId: u8, eventId: e3, status: 'uninterested' },
      { userId: u8, eventId: e2, status: 'uninterested' },
      { userId: u9, eventId: e1, status: 'uninterested' },
      { userId: u9, eventId: e3, status: 'uninterested' },
    ];
    for (const pair of userEventPairs) {
      const existing = await ctx.db
        .query('attendance')
        .filter((q) =>
          q.and(q.eq(q.field('userId'), pair.userId), q.eq(q.field('eventId'), pair.eventId))
        )
        .first();
      if (!existing) {
        await ctx.db.insert('attendance', { ...pair, updatedAt: Date.now() });
      }
    }

    //  Event Tags
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

    //  Per-user preferred tags
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

    return { users: userIds, events: eventIds, tags: tagIds };
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
    return await ctx.runMutation(anyApi.temp_seed.seedData, { eventMediaIds });
  },
});
