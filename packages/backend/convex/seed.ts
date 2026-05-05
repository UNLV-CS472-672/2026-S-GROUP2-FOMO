import { anyApi } from 'convex/server';
import { v } from 'convex/values';

import { action, ActionCtx, internalMutation, internalQuery } from './_generated/server';
import { eventSeedAttendees, eventSeeds } from './eventSeedsStatic';

export { eventSeedAttendees, eventSeeds };

//TODO get from backend instead

type EventVariantPostBlueprint = {
  caption: string;
  eventIndex: number;
  authorIndex: number;
  mediaCount: number;
  mediaQuery: string;
};

const stockImageUrls = [
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
] as const;

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function stockImageUrl(_query: string, seed: string) {
  return stockImageUrls[hashSeed(seed) % stockImageUrls.length]!;
}

const eventMediaQueries = [
  'coffee,study,cafe',
  'concert,rap,music',
  'birthday,party,college',
  'art,street,festival',
  'conference,panel,speaker',
  'anime,cosplay,gaming',
  'concert,stage,hip-hop',
  'lantern,night,festival',
  'thrift,fashion,streetwear',
] as const;

const postSeedMedia = [
  {
    key: 'Best late-night food near campus?\n\nDrop your go-to spots.',
    imageUrl: stockImageUrl('late night food restaurant', 'seed-e1-p1'),
  },
  {
    key: 'Top 5 matcha cafes across Las Vegas Chinatown.\n\nSpoiler Alert: it aint Pop Cafe',
    imageUrl: stockImageUrl('matcha cafe tea', 'seed-e1-p2'),
  },
  {
    key: 'Happy Birthday Shemes!!!\n\nGo Psi Rho! Happy birthday to my big bro, the BIG 21!',
    imageUrl: stockImageUrl('birthday party friends', 'seed-e3-p1'),
  },
  {
    key: 'psi rho rush week recap\n\nif you missed it you really missed it. brotherhood is unmatched fr',
    imageUrl: stockImageUrl('college party group', 'seed-e3-p2'),
  },
  {
    key: 'fight at first friday!!!\n\nBROOOO THSI DUDE HIT HIM W A STOP SIGN',
    imageUrl: stockImageUrl('street festival crowd', 'seed-e4-p1'),
  },
  {
    key: 'first friday art picks this month\n\nsaw some insane murals near the container park. the arts scene in dtlv is really coming up',
    imageUrl: stockImageUrl('street art mural', 'seed-e4-p2'),
  },
  {
    key: 'St Jimmy - A prodigy, a god-sent\n\nA pinnacle of man. The way he orchestrates his words... Extraordinary...',
    imageUrl: stockImageUrl('speaker conference stage', 'seed-e5-p1'),
  },
  {
    key: 'panel notes from st. jimmy\n\nstill processing half of what he said but the room was locked in the whole time',
    imageUrl: stockImageUrl('conference audience panel', 'seed-e5-p2'),
  },
  {
    key: 'Rate my cosplays! 1-10\n\nbe brutally honest, i spent 5 grand on all these cosplays',
    imageUrl: stockImageUrl('cosplay anime convention', 'seed-e6-p1'),
  },
  {
    key: 'anyone going to LVL UP this year?\n\nfirst time going, dont know what to expect. do i need to cosplay??',
    imageUrl: stockImageUrl('gaming expo convention', 'seed-e6-p2'),
  },
  {
    key: 'my first cosplay ever!!\n\nwent as toji fushiguro and someone said i looked like a middle schooler in a costume... be kind',
    imageUrl: stockImageUrl('anime cosplay portrait', 'seed-e6-p3'),
  },
  {
    key: 'met baby keem ?????\n\ni just saw this dude walking across caesars palace? asked for a pic but he spit in my face and started flying way :(',
    imageUrl: stockImageUrl('concert venue crowd', 'seed-e7-p1'),
  },
  {
    key: 'baby keem setlist was CRAZY\n\nhomicide, trademark da baby, family ties back to back?? i blacked out',
    imageUrl: stockImageUrl('concert stage lights', 'seed-e7-p2'),
  },
  {
    key: 'water lantern festival was so peaceful\n\ngenuinely one of the most beautiful nights ive had in vegas. 10/10 would litter the pond again',
    imageUrl: stockImageUrl('lantern festival water', 'seed-e8-p1'),
  },
  {
    key: 'lantern messages hit way too hard\n\nread three strangers wishes and had to stare at the water for a minute',
    imageUrl: stockImageUrl('night lanterns lake', 'seed-e8-p2'),
  },
  {
    key: 'thrift valley haul just dropped\n\ngrabbed a vintage carhartt and some cargos for $18 total. they are NOT out of stussy btw',
    imageUrl: stockImageUrl('thrift fashion outfit', 'seed-e9-p1'),
  },
  {
    key: 'best rack at thrift valley no debate\n\nfound two washed hoodies and a denim jacket that still smelled expensive',
    imageUrl: stockImageUrl('streetwear thrift rack', 'seed-e9-p2'),
  },
] as const;

const eventVariantPostBlueprints: EventVariantPostBlueprint[] = eventSeeds.flatMap(
  (event, eventIndex) => [
    {
      caption: `${event.name} roll call\n\nwho is actually pulling up to ${event.organization}?`,
      eventIndex,
      authorIndex: eventIndex % 9,
      mediaCount: 0,
      mediaQuery: eventMediaQueries[eventIndex]!,
    },
    {
      caption: `${event.name} preview dump\n\nsaving these before everyone starts asking where this was`,
      eventIndex,
      authorIndex: (eventIndex + 1) % 9,
      mediaCount: 1,
      mediaQuery: `${eventMediaQueries[eventIndex]!},people`,
    },
    {
      caption: `${event.name} single-frame recap`,
      eventIndex,
      authorIndex: (eventIndex + 2) % 9,
      mediaCount: 1,
      mediaQuery: `${eventMediaQueries[eventIndex]!},portrait`,
    },
    {
      caption: `${event.name} photo pair\n\ntwo angles because one was not enough`,
      eventIndex,
      authorIndex: (eventIndex + 3) % 9,
      mediaCount: 2,
      mediaQuery: `${eventMediaQueries[eventIndex]!},duo`,
    },
    {
      caption: `${event.name} mini album\n\nthree frames and somehow none of them fully explain the vibe`,
      eventIndex,
      authorIndex: (eventIndex + 4) % 9,
      mediaCount: 3,
      mediaQuery: `${eventMediaQueries[eventIndex]!},crowd`,
    },
    {
      caption: `${event.name} full set\n\nposting four because deleting any of these felt criminal`,
      eventIndex,
      authorIndex: (eventIndex + 5) % 9,
      mediaCount: 4,
      mediaQuery: `${eventMediaQueries[eventIndex]!},details`,
    },
    {
      caption: `${event.name} camera roll unload\n\nfive shots deep and i still left out the best part of the night`,
      eventIndex,
      authorIndex: (eventIndex + 6) % 9,
      mediaCount: 5,
      mediaQuery: `${eventMediaQueries[eventIndex]!},night`,
    },
  ]
);

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

export const getSeedPostMediaIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const existingPosts = await ctx.db.query('posts').collect();
    const mediaIdByCaption = new Map(
      existingPosts.map((post) => [post.caption ?? null, post.mediaIds?.[0] ?? null])
    );

    return postSeedMedia.map((entry) => mediaIdByCaption.get(entry.key) ?? null);
  },
});

export const getSeedVariantPostMediaIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const existingPosts = await ctx.db.query('posts').collect();
    const mediaIdsByCaption = new Map(
      existingPosts.map((post) => [post.caption ?? null, post.mediaIds ?? []])
    );

    return eventVariantPostBlueprints.map((entry) => {
      const existingMediaIds = mediaIdsByCaption.get(entry.caption) ?? [];
      return existingMediaIds.slice(0, entry.mediaCount);
    });
  },
});

export const seedData = internalMutation({
  args: {
    eventMediaIds: v.array(v.id('_storage')),
    postMediaIds: v.array(v.id('_storage')),
    variantPostMediaIds: v.array(v.array(v.id('_storage'))),
  },
  handler: async (ctx, { eventMediaIds, postMediaIds, variantPostMediaIds }) => {
    if (eventMediaIds.length !== eventSeeds.length) {
      throw new Error('Expected one media id per seeded event.');
    }
    if (postMediaIds.length !== postSeedMedia.length) {
      throw new Error('Expected one media id per seeded post photo.');
    }
    if (variantPostMediaIds.length !== eventVariantPostBlueprints.length) {
      throw new Error('Expected one media id array per seeded variant post.');
    }

    //  Users (Convex Table Name: users)
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
      { name: 'Claude', clerkId: 'seed|claude' },
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
    const [u1, u2, u3, u4, u5, u6, u7, u8, u9, u10] = userIds;

    //  Tags (Convex: tags)
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

    //  Events (Convex: events)
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
          lastPostAt: 0,
        })
      );
    }
    const [e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17] = eventIds;

    //  Users/Events Join Table (Convex: attendance)
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

      // Interested but not yet going.
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

      // Events the user explicitly does not want.
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
        .filter((q) =>
          q.and(q.eq(q.field('userId'), pair.userId), q.eq(q.field('eventId'), pair.eventId))
        )
        .first();
      if (!existing) {
        await ctx.db.insert('attendance', { ...pair, updatedAt: Date.now() });
      }
    }

    //  Event Tags (Convex: eventTags)
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
      // e11: UNLV Career & Culture Fair — college/fair/insightful/study/vendors
      { eventId: e11, tagId: tagIds['college'] },
      { eventId: e11, tagId: tagIds['fair'] },
      { eventId: e11, tagId: tagIds['insightful'] },
      { eventId: e11, tagId: tagIds['study'] },
      { eventId: e11, tagId: tagIds['vendors'] },
      // e12: Vegas Streetwear Market — fits/clothes/thrift/vendors/culture
      { eventId: e12, tagId: tagIds['fits'] },
      { eventId: e12, tagId: tagIds['clothes'] },
      { eventId: e12, tagId: tagIds['thrift'] },
      { eventId: e12, tagId: tagIds['vendors'] },
      { eventId: e12, tagId: tagIds['culture'] },
      // e13: Desert Rap Cypher — rap/wild/music/party/college
      { eventId: e13, tagId: tagIds['rap'] },
      { eventId: e13, tagId: tagIds['wild'] },
      { eventId: e13, tagId: tagIds['music'] },
      { eventId: e13, tagId: tagIds['party'] },
      { eventId: e13, tagId: tagIds['college'] },
      // e14: Downtown Art Walk — art/culture/insightful/fair
      { eventId: e14, tagId: tagIds['art'] },
      { eventId: e14, tagId: tagIds['culture'] },
      { eventId: e14, tagId: tagIds['insightful'] },
      { eventId: e14, tagId: tagIds['fair'] },
      // e15: Sunset Chill Fest — chill/r&b/food/music/drink
      { eventId: e15, tagId: tagIds['chill'] },
      { eventId: e15, tagId: tagIds['r&b'] },
      { eventId: e15, tagId: tagIds['food'] },
      { eventId: e15, tagId: tagIds['music'] },
      { eventId: e15, tagId: tagIds['drink'] },
      // e16: Neon Birthday Bash — birthday/party/wild/drink/music
      { eventId: e16, tagId: tagIds['birthday'] },
      { eventId: e16, tagId: tagIds['party'] },
      { eventId: e16, tagId: tagIds['wild'] },
      { eventId: e16, tagId: tagIds['drink'] },
      { eventId: e16, tagId: tagIds['music'] },
      // e17: UNLV Anime Club Screening — anime/comics/college/chill
      { eventId: e17, tagId: tagIds['anime'] },
      { eventId: e17, tagId: tagIds['comics'] },
      { eventId: e17, tagId: tagIds['college'] },
      { eventId: e17, tagId: tagIds['chill'] },
    ];
    for (const pair of eventTagPairs) {
      const existing = await ctx.db
        .query('eventTags')
        .filter((q) =>
          q.and(q.eq(q.field('eventId'), pair.eventId), q.eq(q.field('tagId'), pair.tagId))
        )
        .first();
      if (!existing) await ctx.db.insert('eventTags', pair);
    }

    //  Posts (Convex: posts)
    const postSeeds = [
      {
        caption: 'Best late-night food near campus?\n\nDrop your go-to spots.',
        eventId: e1,
        mediaIds: [postMediaIds[0]!],
        authorId: u1,
      },
      {
        caption:
          'Top 5 matcha cafes across Las Vegas Chinatown.\n\nSpoiler Alert: it aint Pop Cafe',
        eventId: e1,
        mediaIds: [postMediaIds[1]!],
        authorId: u1,
      },
      {
        lookupCaption: 'fight at first friday!!!\n\nBROOOO THSI DUDE HIT HIM W A STOP SIGN',
        eventId: e4,
        mediaIds: [postMediaIds[6]!],
        authorId: u3,
      },
      {
        caption:
          'Happy Birthday Shemes!!!\n\nGo Psi Rho! Happy birthday to my big bro, the BIG 21!',
        eventId: e3,
        mediaIds: [postMediaIds[4]!],
        authorId: u4,
      },
      {
        caption:
          'St Jimmy - A prodigy, a god-sent\n\nA pinnacle of man. The way he orchestrates his words... Extraordinary...',
        eventId: e5,
        mediaIds: [postMediaIds[8]!],
        authorId: u5,
      },
      {
        caption: 'Need some anime recs / good music\n\ni loveeee wallows and vinland saga',
        eventId: e6,
        authorId: u7,
      },
      {
        lookupCaption:
          'Rate my cosplays! 1-10\n\nbe brutally honest, i spent 5 grand on all these cosplays',
        eventId: e6,
        mediaIds: [postMediaIds[10]!],
        authorId: u7,
      },
      {
        lookupCaption:
          'met baby keem ?????\n\n' +
          'i just saw this dude walking across caesars palace? asked for a pic but he spit in my face and started flying way :(',
        eventId: e7,
        mediaIds: [postMediaIds[13]!],
        authorId: u8,
      },
      {
        caption: 'FOMO Study Session\n\nwe are WINNING that competition',
        eventId: e1,
        authorId: u9,
      },
      {
        caption:
          'anyone going to LVL UP this year?\n\nfirst time going, dont know what to expect. do i need to cosplay??',
        eventId: e6,
        mediaIds: [postMediaIds[11]!],
        authorId: u5,
      },
      {
        lookupCaption:
          'thrift valley haul just dropped\n\n' +
          'grabbed a vintage carhartt and some cargos for $18 total. they are NOT out of stussy btw',
        eventId: e9,
        mediaIds: [postMediaIds[15]!],
        authorId: u2,
      },
      {
        lookupCaption:
          'water lantern festival was so peaceful\n\n' +
          'genuinely one of the most beautiful nights ive had in vegas. 10/10 would litter the pond again',
        eventId: e8,
        mediaIds: [postMediaIds[15]!],
        authorId: u4,
      },
      {
        caption:
          'UNLV library or coffee shop for finals?\n\nim cooked either way but where do yall go to grind',
        eventId: e1,
        authorId: u9,
      },
      {
        caption:
          'chinatown food crawl this saturday\n\nhitting 5 spots in one night. dm if you tryna pull up',
        eventId: e1,
        authorId: u3,
      },
      {
        caption:
          'my first cosplay ever!!\n\n' +
          'went as toji fushiguro and someone said i looked like a middle schooler in a costume... be kind',
        eventId: e6,
        mediaIds: [postMediaIds[12]!],
        authorId: u5,
      },
      {
        lookupCaption:
          'baby keem setlist was CRAZY\n\nhomicide, trademark da baby, family ties back to back?? i blacked out',
        eventId: e7,
        mediaIds: [postMediaIds[14]!],
        authorId: u8,
      },
      {
        caption:
          'first friday art picks this month\n\n' +
          'saw some insane murals near the container park. the arts scene in dtlv is really coming up',
        eventId: e4,
        mediaIds: [postMediaIds[7]!],
        authorId: u6,
      },
      {
        caption:
          'need a study group for calc 2\n\n' +
          'series and sequences got me in a chokehold. anyone down to meet up at pop cafe?',
        eventId: e1,
        authorId: u1,
      },
      {
        caption:
          'psi rho rush week recap\n\nif you missed it you really missed it. brotherhood is unmatched fr',
        eventId: e3,
        mediaIds: [postMediaIds[5]!],
        authorId: u4,
      },
      {
        caption:
          'panel notes from st. jimmy\n\n' +
          'still processing half of what he said but the room was locked in the whole time',
        eventId: e5,
        mediaIds: [postMediaIds[9]!],
        authorId: u6,
      },
      {
        caption:
          'pre-concert fit check\n\nblack tee, silver chain, questionable financial decisions at the merch booth incoming',
        eventId: e2,
        mediaIds: [postMediaIds[2]!],
        authorId: u2,
      },
      {
        caption:
          'rocky opener was actually insane\n\ncrowd was yelling every word before the lights even dropped',
        eventId: e2,
        mediaIds: [postMediaIds[3]!],
        authorId: u6,
      },
      {
        caption:
          'lantern messages hit way too hard\n\nread three strangers wishes and had to stare at the water for a minute',
        eventId: e8,
        mediaIds: [postMediaIds[16]!],
        authorId: u8,
      },
      {
        caption:
          'best rack at thrift valley no debate\n\nfound two washed hoodies and a denim jacket that still smelled expensive',
        eventId: e9,
        mediaIds: [postMediaIds[16]!],
        authorId: u7,
      },
    ];
    const postIds: any[] = [];
    for (const p of postSeeds) {
      const caption = p.caption ?? p.lookupCaption;
      if (!caption) {
        throw new Error('Seeded post is missing caption text.');
      }

      const existing = await ctx.db
        .query('posts')
        .filter((q) => q.eq(q.field('caption'), caption))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          eventId: p.eventId,
          caption,
          mediaIds: p.mediaIds,
        });
        postIds.push(existing._id);
        continue;
      }

      const { lookupCaption: _lookupCaption, ...post } = p;
      postIds.push(
        await ctx.db.insert('posts', { ...post, caption, mediaIds: post.mediaIds ?? [] })
      );
    }

    const eventIdList = [e1, e2, e3, e4, e5, e6, e7, e8, e9];
    for (const [index, blueprint] of eventVariantPostBlueprints.entries()) {
      const existing = await ctx.db
        .query('posts')
        .filter((q) => q.eq(q.field('caption'), blueprint.caption))
        .first();

      const mediaIds = variantPostMediaIds[index] ?? [];
      const payload = {
        eventId: eventIdList[blueprint.eventIndex]!,
        authorId: userIds[blueprint.authorIndex]!,
        caption: blueprint.caption,
        mediaIds: mediaIds,
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
        postIds.push(existing._id);
        continue;
      }

      postIds.push(await ctx.db.insert('posts', payload));
    }
    const [
      p1,
      p2,
      p3,
      p4,
      p5,
      p6,
      p7,
      p8,
      p9,
      p10,
      p11,
      p12,
      p13,
      p14,
      p15,
      p16,
      p17,
      p18,
      p19,
      p20,
      p21,
      p22,
      p23,
      p24,
    ] = postIds;

    //  Post Tags (Convex: postTags)
    const postTagPairs = [
      { postId: p1, tagId: tagIds['food'] },
      { postId: p2, tagId: tagIds['food'] },
      { postId: p2, tagId: tagIds['drink'] },
      { postId: p2, tagId: tagIds['study'] },
      { postId: p2, tagId: tagIds['chinatown'] },
      { postId: p3, tagId: tagIds['wild'] },
      { postId: p4, tagId: tagIds['party'] },
      { postId: p4, tagId: tagIds['college'] },
      { postId: p4, tagId: tagIds['birthday'] },
      { postId: p5, tagId: tagIds['insightful'] },
      { postId: p6, tagId: tagIds['music'] },
      { postId: p6, tagId: tagIds['anime'] },
      { postId: p6, tagId: tagIds['culture'] },
      { postId: p7, tagId: tagIds['anime'] },
      { postId: p7, tagId: tagIds['games'] },
      { postId: p7, tagId: tagIds['comics'] },
      { postId: p8, tagId: tagIds['music'] },
      { postId: p8, tagId: tagIds['wild'] },
      { postId: p9, tagId: tagIds['college'] },
      { postId: p9, tagId: tagIds['study'] },
      { postId: p9, tagId: tagIds['insightful'] },
      { postId: p10, tagId: tagIds['convention'] },
      { postId: p10, tagId: tagIds['anime'] },
      { postId: p10, tagId: tagIds['games'] },
      { postId: p11, tagId: tagIds['thrift'] },
      { postId: p11, tagId: tagIds['clothes'] },
      { postId: p11, tagId: tagIds['fits'] },
      { postId: p12, tagId: tagIds['chill'] },
      { postId: p12, tagId: tagIds['culture'] },
      { postId: p13, tagId: tagIds['study'] },
      { postId: p13, tagId: tagIds['college'] },
      { postId: p14, tagId: tagIds['food'] },
      { postId: p14, tagId: tagIds['chinatown'] },
      { postId: p14, tagId: tagIds['culture'] },
      { postId: p15, tagId: tagIds['anime'] },
      { postId: p15, tagId: tagIds['comics'] },
      { postId: p15, tagId: tagIds['wild'] },
      { postId: p16, tagId: tagIds['concert'] },
      { postId: p16, tagId: tagIds['rap'] },
      { postId: p16, tagId: tagIds['music'] },
      { postId: p17, tagId: tagIds['art'] },
      { postId: p17, tagId: tagIds['music'] },
      { postId: p17, tagId: tagIds['culture'] },
      { postId: p18, tagId: tagIds['study'] },
      { postId: p18, tagId: tagIds['college'] },
      { postId: p18, tagId: tagIds['food'] },
      { postId: p19, tagId: tagIds['party'] },
      { postId: p19, tagId: tagIds['college'] },
      { postId: p19, tagId: tagIds['insightful'] },
      { postId: p20, tagId: tagIds['panel'] },
      { postId: p20, tagId: tagIds['conference'] },
      { postId: p20, tagId: tagIds['insightful'] },
      { postId: p21, tagId: tagIds['concert'] },
      { postId: p21, tagId: tagIds['fits'] },
      { postId: p21, tagId: tagIds['music'] },
      { postId: p22, tagId: tagIds['concert'] },
      { postId: p22, tagId: tagIds['rap'] },
      { postId: p22, tagId: tagIds['music'] },
      { postId: p23, tagId: tagIds['chill'] },
      { postId: p23, tagId: tagIds['culture'] },
      { postId: p24, tagId: tagIds['thrift'] },
      { postId: p24, tagId: tagIds['fits'] },
      { postId: p24, tagId: tagIds['clothes'] },
    ];
    for (const pair of postTagPairs) {
      const existing = await ctx.db
        .query('postTags')
        .filter((q) =>
          q.and(q.eq(q.field('postId'), pair.postId), q.eq(q.field('tagId'), pair.tagId))
        )
        .first();
      if (!existing) await ctx.db.insert('postTags', pair);
    }

    //  Comments (Convex: comments)
    const comments = [
      { postId: p1, authorId: u2, text: 'Gorilla Sushi!' },
      { postId: p1, authorId: u4, text: 'used to be top sushi, went downhill tho' },
      { postId: p1, authorId: u5, text: 'Chubby Cattle is fire! (smilehappy)' },
      { postId: p2, authorId: u1, text: 'What did Pop Cafe do wrong lol' },
      { postId: p2, authorId: u2, text: 'Im honestly shocked Airoma wasnt on the list.' },
      { postId: p2, authorId: u4, text: 'i concur, pop cafe be cheeks' },
      { postId: p2, authorId: u5, text: 'last time i had matcha bad things happen' },
      { postId: p3, authorId: u1, text: 'OUCH!' },
      { postId: p3, authorId: u3, text: 'straight for da noggin' },
      { postId: p3, authorId: u6, text: 'I know that dude' },
      { postId: p4, authorId: u1, text: 'HAPPY BIRTHDAY SHEMES' },
      { postId: p4, authorId: u2, text: 'Thank you for the fun night!!' },
      { postId: p5, authorId: u2, text: 'Hes so good at speaking it gave me amnesia.' },
      { postId: p5, authorId: u5, text: 'Hes so good at speaking it gave me amnesia.' },
      { postId: p5, authorId: u3, text: 'Amazing.' },
      { postId: p5, authorId: u6, text: 'Revolutionary.' },
      { postId: p6, authorId: u3, text: 'SAO!' },
      { postId: p6, authorId: u7, text: 'my guy said sao im crine' },
      { postId: p7, authorId: u6, text: 'I love it!!' },
      { postId: p7, authorId: u8, text: 'unrecognizable' },
      { postId: p7, authorId: u9, text: '2, i hate toji' },
      { postId: p8, authorId: u3, text: 'deserved tbh' },
      { postId: p8, authorId: u5, text: 'frank ocean bird.. chirp chirp' },
      { postId: p8, authorId: u6, text: 'How unprofessional!!!' },
      { postId: p8, authorId: u9, text: 'i love gnx!' },
      { postId: p8, authorId: u3, text: 'GREAT WORK TEAM!!!' },
      { postId: p8, authorId: u7, text: 'same time next week?' },
      { postId: p8, authorId: u8, text: 'Are we meeting at Pop next meeting?' },
      { postId: p10, authorId: u7, text: 'YES and you 100% should cosplay, its way more fun' },
      {
        postId: p10,
        authorId: u6,
        text: 'i went last year, bring cash for the vendor hall it gets crazy',
      },
      { postId: p10, authorId: u9, text: 'no pressure on cosplay but people go all out fr' },
      { postId: p11, authorId: u1, text: 'WAIT they still have stussy?? im pulling up' },
      { postId: p11, authorId: u4, text: 'carhartt for $18 is actually insane' },
      { postId: p11, authorId: u7, text: 'bro the fits section of this app was made for you' },
      { postId: p12, authorId: u3, text: 'literally cried it was so pretty' },
      { postId: p12, authorId: u8, text: 'litter the pond again LMAOOO' },
      { postId: p12, authorId: u5, text: 'i missed it and im so sad' },
      {
        postId: p13,
        authorId: u2,
        text: 'coffee shop for sure, library got too much eye contact energy',
      },
      { postId: p13, authorId: u6, text: 'pop cafe during off hours hits different for studying' },
      { postId: p13, authorId: u3, text: 'neither, i study in my car' },
      { postId: p14, authorId: u1, text: 'im in, what time' },
      { postId: p14, authorId: u8, text: 'save me a spot at the hot pot place' },
      { postId: p14, authorId: u5, text: 'chinatown crawl is a core unlv experience' },
      { postId: p15, authorId: u7, text: 'nah you looked clean dont let them play you' },
      { postId: p15, authorId: u9, text: 'toji is literally the coolest character what' },
      { postId: p15, authorId: u2, text: 'post pics!!! we need to see' },
      { postId: p16, authorId: u3, text: 'homicide live had me on another planet' },
      { postId: p16, authorId: u2, text: 'family ties made the whole crowd go insane' },
      { postId: p16, authorId: u9, text: 'i cant believe i missed this' },
      { postId: p17, authorId: u4, text: 'the murals by the lot on 3rd are so underrated' },
      { postId: p17, authorId: u1, text: 'DTLV has been going crazy lately' },
      { postId: p17, authorId: u9, text: 'which artists did you see? looking for local recs' },
      { postId: p18, authorId: u5, text: 'im down, i need help with sequences too' },
      { postId: p18, authorId: u3, text: 'pop cafe is the move, see you there' },
      { postId: p18, authorId: u7, text: 'calc 2 is genuinely evil i feel this' },
      { postId: p19, authorId: u2, text: 'rush week was unreal, glad i joined' },
      { postId: p19, authorId: u6, text: 'psi rho stays winning' },
      { postId: p19, authorId: u3, text: 'brotherhood > everything' },
      { postId: p21, authorId: u8, text: 'chain is carrying the whole fit ngl' },
      { postId: p21, authorId: u4, text: 'merch booth debt is temporary aura is forever' },
      { postId: p22, authorId: u2, text: 'the opener lowkey outperformed everybody' },
      { postId: p22, authorId: u9, text: 'i lost my voice before rocky even came out' },
      { postId: p23, authorId: u5, text: 'this whole event healed me a little bit' },
      { postId: p23, authorId: u3, text: 'sunset park after dark really has a crazy vibe' },
      { postId: p24, authorId: u2, text: 'denim jacket sounds like a generational pull' },
      { postId: p24, authorId: u8, text: 'need thrift valley to become a monthly problem' },
    ];
    const seededComments: { _id: any; postId: any; authorId: any; text: string }[] = [];
    for (const comment of comments) {
      const existing = await ctx.db
        .query('comments')
        .filter((q) =>
          q.and(
            q.eq(q.field('postId'), comment.postId),
            q.eq(q.field('authorId'), comment.authorId),
            q.eq(q.field('text'), comment.text)
          )
        )
        .first();
      const commentId = existing?._id ?? (await ctx.db.insert('comments', comment));
      seededComments.push({ _id: commentId, ...comment });
    }

    // Seed post likes from a handful of example posts.
    const postLikePairs = [
      { userId: u2, postId: p1 },
      { userId: u4, postId: p1 },
      { userId: u3, postId: p3 },
      { userId: u6, postId: p3 },
      { userId: u1, postId: p4 },
      { userId: u8, postId: p7 },
      { userId: u9, postId: p7 },
      { userId: u3, postId: p8 },
      { userId: u7, postId: p10 },
      { userId: u1, postId: p11 },
      { userId: u8, postId: p12 },
      { userId: u2, postId: p13 },
      { userId: u8, postId: p14 },
      { userId: u7, postId: p15 },
      { userId: u2, postId: p16 },
      { userId: u4, postId: p17 },
      { userId: u5, postId: p18 },
      { userId: u2, postId: p19 },
      { userId: u8, postId: p21 },
      { userId: u4, postId: p22 },
      { userId: u1, postId: p23 },
      { userId: u6, postId: p24 },
    ];
    for (const pair of postLikePairs) {
      const existing = await ctx.db
        .query('likes')
        .withIndex('by_userId_postId', (q) => q.eq('userId', pair.userId).eq('postId', pair.postId))
        .unique();
      if (!existing) {
        await ctx.db.insert('likes', pair);
        const post = (await ctx.db.get(pair.postId)) as any;
        await ctx.db.patch(pair.postId, { likeCount: (post?.likeCount ?? 0) + 1 });
      }
    }

    const findCommentId = (postId: any, text: string) =>
      seededComments.find(
        (comment) => String(comment.postId) === String(postId) && comment.text === text
      )?._id;

    // Seed comment likes from a few of the example comments.
    const commentLikePairs = [
      { userId: u1, commentId: findCommentId(p1, 'Gorilla Sushi!') },
      { userId: u6, commentId: findCommentId(p1, 'used to be top sushi, went downhill tho') },
      { userId: u3, commentId: findCommentId(p2, 'Im honestly shocked Airoma wasnt on the list.') },
      { userId: u8, commentId: findCommentId(p3, 'straight for da noggin') },
      { userId: u9, commentId: findCommentId(p4, 'Thank you for the fun night!!') },
      { userId: u4, commentId: findCommentId(p6, 'my guy said sao im crine') },
      { userId: u5, commentId: findCommentId(p7, 'I love it!!') },
      {
        userId: u2,
        commentId: findCommentId(p10, 'YES and you 100% should cosplay, its way more fun'),
      },
      { userId: u9, commentId: findCommentId(p11, 'carhartt for $18 is actually insane') },
      { userId: u1, commentId: findCommentId(p12, 'literally cried it was so pretty') },
      { userId: u4, commentId: findCommentId(p14, 'save me a spot at the hot pot place') },
      { userId: u8, commentId: findCommentId(p16, 'family ties made the whole crowd go insane') },
      {
        userId: u1,
        commentId: findCommentId(p17, 'which artists did you see? looking for local recs'),
      },
      { userId: u6, commentId: findCommentId(p18, 'pop cafe is the move, see you there') },
      { userId: u5, commentId: findCommentId(p19, 'brotherhood > everything') },
    ].filter((pair): pair is { userId: any; commentId: any } => Boolean(pair.commentId));

    for (const pair of commentLikePairs) {
      const existing = await ctx.db
        .query('likes')
        .withIndex('by_userId_commentId', (q) =>
          q.eq('userId', pair.userId).eq('commentId', pair.commentId)
        )
        .unique();
      if (!existing) {
        await ctx.db.insert('likes', pair);
        const comment = (await ctx.db.get(pair.commentId)) as any;
        await ctx.db.patch(pair.commentId, { likeCount: (comment?.likeCount ?? 0) + 1 });
      }
    }

    const friendPairs = [
      { requesterId: u1, recipientId: u2, status: 'accepted' },
      { requesterId: u1, recipientId: u4, status: 'pending' },
      { requesterId: u1, recipientId: u5, status: 'accepted' },

      { requesterId: u2, recipientId: u3, status: 'accepted' },

      { requesterId: u3, recipientId: u4, status: 'accepted' },
      { requesterId: u3, recipientId: u5, status: 'accepted' },
      { requesterId: u3, recipientId: u6, status: 'accepted' },

      { requesterId: u4, recipientId: u5, status: 'accepted' },
      { requesterId: u4, recipientId: u8, status: 'rejected' },

      { requesterId: u5, recipientId: u6, status: 'accepted' },

      { requesterId: u6, recipientId: u8, status: 'accepted' },

      { requesterId: u7, recipientId: u1, status: 'pending' },
      { requesterId: u7, recipientId: u3, status: 'rejected' },

      { requesterId: u8, recipientId: u1, status: 'pending' },
    ] as const;
    for (const pair of friendPairs) {
      const existing = await ctx.db
        .query('friends')
        .withIndex('by_recipientId_requesterId', (q) =>
          q.eq('recipientId', pair.recipientId).eq('requesterId', pair.requesterId)
        )
        .first();
      if (!existing) await ctx.db.insert('friends', pair);
    }

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

    const userColdStartSeeds: { userId: any; preferred: string[] }[] = [
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

    for (const entry of userColdStartSeeds) {
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
      event: eventIds,
      post: postIds,
      tags: tagIds,
    };
  },
});

export const seed = action({
  args: {},
  handler: async (ctx) => {
    const existingMediaIds = await ctx.runQuery(anyApi.seed.getSeedEventMediaIds, {});
    const existingPostMediaIds = await ctx.runQuery(anyApi.seed.getSeedPostMediaIds, {});
    const existingVariantPostMediaIds = await ctx.runQuery(
      anyApi.seed.getSeedVariantPostMediaIds,
      {}
    );
    const eventMediaIds = await Promise.all(
      eventSeeds.map(async (event, index) => {
        return existingMediaIds[index] ?? (await storeSeedEventImage(ctx, event.imageUrl));
      })
    );
    const postMediaIds = await Promise.all(
      postSeedMedia.map(async (entry, index) => {
        return existingPostMediaIds[index] ?? (await storeSeedEventImage(ctx, entry.imageUrl));
      })
    );
    const variantPostMediaIds = await Promise.all(
      eventVariantPostBlueprints.map(async (entry, index) => {
        const existingIds = existingVariantPostMediaIds[index] ?? [];
        if (existingIds.length === entry.mediaCount) {
          return existingIds;
        }

        return await Promise.all(
          Array.from(
            { length: entry.mediaCount },
            async (_value, mediaIndex) =>
              await storeSeedEventImage(
                ctx,
                stockImageUrl(
                  entry.mediaQuery,
                  `variant-${entry.eventIndex}-${index}-${mediaIndex}`
                )
              )
          )
        );
      })
    );

    return await ctx.runMutation(anyApi.seed.seedData, {
      eventMediaIds,
      postMediaIds,
      variantPostMediaIds,
    });
  },
});
