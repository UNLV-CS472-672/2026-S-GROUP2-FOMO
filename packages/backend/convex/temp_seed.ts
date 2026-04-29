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
      existingPosts.map((post) => [post.caption ?? null, post.mediaIds[0] ?? null])
    );

    return postSeedMedia.map((entry) => mediaIdByCaption.get(entry.key) ?? null);
  },
});

export const getSeedVariantPostMediaIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const existingPosts = await ctx.db.query('posts').collect();
    const mediaIdsByCaption = new Map(
      existingPosts.map((post) => [post.caption ?? null, post.mediaIds])
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
    // Posts disabled — skip post media validators.
    // if (postMediaIds.length !== postSeedMedia.length) {
    //   throw new Error('Expected one media id per seeded post photo.');
    // }
    // if (variantPostMediaIds.length !== eventVariantPostBlueprints.length) {
    //   throw new Error('Expected one media id array per seeded variant post.');
    // }

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
            displayName: u.name,
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
          startDate: e.startDate,
          endDate: e.endDate,
          location: e.location,
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
        .withIndex('by_user_event', (q) => q.eq('userId', pair.userId).eq('eventId', pair.eventId))
        .unique();
      if (!existing) await ctx.db.insert('attendance', pair);
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
        .withIndex('by_event_tag', (q) => q.eq('eventId', pair.eventId).eq('tagId', pair.tagId))
        .unique();
      if (!existing) await ctx.db.insert('eventTags', pair);
    }

    /* ─────────────────────────────────────────────────────────────
       POSTS / POST TAGS / COMMENTS / LIKES — DISABLED
       Re-enable when posts are needed for testing/UI work.
       ───────────────────────────────────────────────────────────── */
    /*
    //  Posts (Convex: posts)
    const postSeeds = [
      { caption: 'Best late-night food near campus?\n\nDrop your go-to spots.', eventId: e1, mediaIds: [postMediaIds[0]!], authorId: u1 },
      { caption: 'Top 5 matcha cafes across Las Vegas Chinatown.\n\nSpoiler Alert: it aint Pop Cafe', eventId: e1, mediaIds: [postMediaIds[1]!], authorId: u1 },
      { lookupCaption: 'fight at first friday!!!\n\nBROOOO THSI DUDE HIT HIM W A STOP SIGN', eventId: e4, mediaIds: [postMediaIds[6]!], authorId: u3 },
      { caption: 'Happy Birthday Shemes!!!\n\nGo Psi Rho! Happy birthday to my big bro, the BIG 21!', eventId: e3, mediaIds: [postMediaIds[4]!], authorId: u4 },
      { caption: 'St Jimmy - A prodigy, a god-sent\n\nA pinnacle of man. The way he orchestrates his words... Extraordinary...', eventId: e5, mediaIds: [postMediaIds[8]!], authorId: u5 },
      { caption: 'Need some anime recs / good music\n\ni loveeee wallows and vinland saga', eventId: e6, authorId: u7 },
      { lookupCaption: 'Rate my cosplays! 1-10\n\nbe brutally honest, i spent 5 grand on all these cosplays', eventId: e6, mediaIds: [postMediaIds[10]!], authorId: u7 },
      { lookupCaption: 'met baby keem ?????\n\ni just saw this dude walking across caesars palace? asked for a pic but he spit in my face and started flying way :(', eventId: e7, mediaIds: [postMediaIds[13]!], authorId: u8 },
      { caption: 'FOMO Study Session\n\nwe are WINNING that competition', eventId: e1, authorId: u9 },
      { caption: 'anyone going to LVL UP this year?\n\nfirst time going, dont know what to expect. do i need to cosplay??', eventId: e6, mediaIds: [postMediaIds[11]!], authorId: u5 },
      { lookupCaption: 'thrift valley haul just dropped\n\ngrabbed a vintage carhartt and some cargos for $18 total. they are NOT out of stussy btw', eventId: e9, mediaIds: [postMediaIds[15]!], authorId: u2 },
      { lookupCaption: 'water lantern festival was so peaceful\n\ngenuinely one of the most beautiful nights ive had in vegas. 10/10 would litter the pond again', eventId: e8, mediaIds: [postMediaIds[15]!], authorId: u4 },
      { caption: 'UNLV library or coffee shop for finals?\n\nim cooked either way but where do yall go to grind', eventId: e1, authorId: u9 },
      { caption: 'chinatown food crawl this saturday\n\nhitting 5 spots in one night. dm if you tryna pull up', eventId: e1, authorId: u3 },
      { caption: 'my first cosplay ever!!\n\nwent as toji fushiguro and someone said i looked like a middle schooler in a costume... be kind', eventId: e6, mediaIds: [postMediaIds[12]!], authorId: u5 },
      { lookupCaption: 'baby keem setlist was CRAZY\n\nhomicide, trademark da baby, family ties back to back?? i blacked out', eventId: e7, mediaIds: [postMediaIds[14]!], authorId: u8 },
      { caption: 'first friday art picks this month\n\nsaw some insane murals near the container park. the arts scene in dtlv is really coming up', eventId: e4, mediaIds: [postMediaIds[7]!], authorId: u6 },
      { caption: 'need a study group for calc 2\n\nseries and sequences got me in a chokehold. anyone down to meet up at pop cafe?', eventId: e1, authorId: u1 },
      { caption: 'psi rho rush week recap\n\nif you missed it you really missed it. brotherhood is unmatched fr', eventId: e3, mediaIds: [postMediaIds[5]!], authorId: u4 },
      { caption: 'panel notes from st. jimmy\n\nstill processing half of what he said but the room was locked in the whole time', eventId: e5, mediaIds: [postMediaIds[9]!], authorId: u6 },
      { caption: 'pre-concert fit check\n\nblack tee, silver chain, questionable financial decisions at the merch booth incoming', eventId: e2, mediaIds: [postMediaIds[2]!], authorId: u2 },
      { caption: 'rocky opener was actually insane\n\ncrowd was yelling every word before the lights even dropped', eventId: e2, mediaIds: [postMediaIds[3]!], authorId: u6 },
      { caption: 'lantern messages hit way too hard\n\nread three strangers wishes and had to stare at the water for a minute', eventId: e8, mediaIds: [postMediaIds[16]!], authorId: u8 },
      { caption: 'best rack at thrift valley no debate\n\nfound two washed hoodies and a denim jacket that still smelled expensive', eventId: e9, mediaIds: [postMediaIds[16]!], authorId: u7 },
    ];
    const postIds: any[] = [];
    for (const p of postSeeds) {
      const caption = p.caption ?? p.lookupCaption;
      if (!caption) throw new Error('Seeded post is missing caption text.');
      const existing = await ctx.db.query('posts').filter((q) => q.eq(q.field('caption'), caption)).first();
      if (existing) {
        await ctx.db.patch(existing._id, { eventId: p.eventId, caption, mediaIds: p.mediaIds ?? [] });
        postIds.push(existing._id);
        continue;
      }
      const { lookupCaption: _lookupCaption, ...post } = p;
      postIds.push(await ctx.db.insert('posts', { ...post, caption, mediaIds: post.mediaIds ?? [] }));
    }

    const eventIdList = [e1, e2, e3, e4, e5, e6, e7, e8, e9];
    for (const [index, blueprint] of eventVariantPostBlueprints.entries()) {
      const existing = await ctx.db.query('posts').filter((q) => q.eq(q.field('caption'), blueprint.caption)).first();
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
    const [p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24] = postIds;

    //  Post Tags, Comments, Post Likes, Comment Likes all disabled with the rest.
    */

    //  Friends
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

    //  User Tag Weights (Convex: userTagWeights)
    //  Cold-start: 1.0 for each preferred tag, 0.0 elsewhere.
    //  Length is NUM_TAGS; updateUserPreferences.py pads to 3 * NUM_TAGS on first run.
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

    return await ctx.runMutation(anyApi.temp_seed.seedData, {
      eventMediaIds,
      postMediaIds,
      variantPostMediaIds,
    });
  },
});
