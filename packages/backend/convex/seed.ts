import { mutation } from './_generated/server';
import { latLngToH3Index } from './data_ml/events';

export const eventSeeds = [
  {
    name: 'Coffee + Homework',
    organization: 'Pop Cafe',
    description: 'Chill study session.',
    location: {
      latitude: 36.12730186736902,
      longitude: -115.19299595922035,
      h3Index: latLngToH3Index(36.12730186736902, -115.19299595922035),
    },
  },
  {
    name: 'ASAP Rocky Concert',
    organization: 'ASAP Rocky',
    description: 'Dont be dumb, pull up.',
    location: {
      latitude: 36.10470771447518,
      longitude: -115.16859227452814,
      h3Index: latLngToH3Index(36.10470771447518, -115.16859227452814),
    },
  },
  {
    name: 'Psi Rho house party',
    organization: 'UNLV - Alpha Psi Rho',
    description: 'no hazing, just good vibes. $10 entry for dudes.',
    location: {
      latitude: 36.10790291877858,
      longitude: -115.14269190902489,
      h3Index: latLngToH3Index(36.10790291877858, -115.14269190902489),
    },
  },
  {
    name: 'Las Vegas - First Friday',
    organization: 'Downtown Las Vegas',
    description:
      'Free-admission monthly event featuring live music, art exhibits, food trucks, and vendors.',
    location: {
      latitude: 36.15958759998514,
      longitude: -115.15239854806732,
      h3Index: latLngToH3Index(36.15958759998514, -115.15239854806732),
    },
  },
  {
    name: 'St. Jimmy Panel & Conference',
    organization: 'st. jimmy',
    description:
      'okay jeez, i been going thru a rough patch. going left, right thru the catacombs.',
    location: {
      latitude: 36.09086216508982,
      longitude: -115.18328464909499,
      h3Index: latLngToH3Index(36.09086216508982, -115.18328464909499),
    },
  },
  {
    name: 'LVL UP EXPO 2026',
    organization: 'LVL UP LLC',
    description:
      'LVL UP EXPO is a three-day immersive gaming and pop culture convention in Las Vegas celebrating fans through esports tournaments, cosplay, art, and entertainment.',
    location: {
      latitude: 36.12871445143533,
      longitude: -115.15149229313623,
      h3Index: latLngToH3Index(36.12871445143533, -115.15149229313623),
    },
  },
  {
    name: 'Baby Keem Concert',
    organization: 'The Cosmopolitan',
    description: 'half past twelve i was all alone.',
    location: {
      latitude: 36.10987909759377,
      longitude: -115.17538973403965,
      h3Index: latLngToH3Index(36.10987909759377, -115.17538973403965),
    },
  },
  {
    name: 'Water Lantern Festival',
    organization: 'SWCTA Key Club',
    description: 'Join us at Sunset Park to litter the pond.',
    location: {
      latitude: 36.03809903957797,
      longitude: -115.24699453074136,
      h3Index: latLngToH3Index(36.03809903957797, -115.24699453074136),
    },
  },
  {
    name: 'Thrift Valley pop up shop',
    organization: 'Thrift Valley',
    description: 'we outta stussy dont even ask',
    location: {
      latitude: 36.15909747099756,
      longitude: -115.15269829421878,
      h3Index: latLngToH3Index(36.15909747099756, -115.15269829421878),
    },
  },

  // ── NEW EVENTS (unattended — added to expand recommendation diversity) ──
  {
    name: 'Chinatown Night Market',
    organization: 'Las Vegas Chinatown Plaza',
    description:
      'Street food, vendors, live music, and cultural performances in the heart of Chinatown.',
    location: {
      latitude: 36.12201837345691,
      longitude: -115.19872034567823,
      h3Index: latLngToH3Index(36.12201837345691, -115.19872034567823),
    },
  },
  {
    name: 'UNLV Career & Culture Fair',
    organization: 'UNLV Student Affairs',
    description:
      'Network with employers, student orgs, and campus resources. Free food and giveaways.',
    location: {
      latitude: 36.10812345678901,
      longitude: -115.14123456789012,
      h3Index: latLngToH3Index(36.10812345678901, -115.14123456789012),
    },
  },
  {
    name: 'Vegas Streetwear Market',
    organization: 'Desert Drip Collective',
    description:
      'Local and independent streetwear brands, vintage fits, and live customization booths.',
    location: {
      latitude: 36.16234567890123,
      longitude: -115.14567890123456,
      h3Index: latLngToH3Index(36.16234567890123, -115.14567890123456),
    },
  },
  {
    name: 'Desert Rap Cypher',
    organization: 'Vegas Underground',
    description: 'Open mic rap cypher. Bring your bars or just pull up and vibe. No gatekeeping.',
    location: {
      latitude: 36.15123456789012,
      longitude: -115.16234567890123,
      h3Index: latLngToH3Index(36.15123456789012, -115.16234567890123),
    },
  },
  {
    name: 'Downtown Art Walk',
    organization: '18b Arts District',
    description:
      'Self-guided tour of galleries, murals, and pop-up installations across the 18b Arts District.',
    location: {
      latitude: 36.17234567890123,
      longitude: -115.14890123456789,
      h3Index: latLngToH3Index(36.17234567890123, -115.14890123456789),
    },
  },
  {
    name: 'Sunset Chill Fest',
    organization: 'Sunset Park Events',
    description:
      'Laid-back outdoor hangout with food trucks, r&b sets, and lawn games at Sunset Park.',
    location: {
      latitude: 36.03912345678901,
      longitude: -115.14678901234567,
      h3Index: latLngToH3Index(36.03912345678901, -115.14678901234567),
    },
  },
  {
    name: 'Neon Birthday Bash',
    organization: 'Private Event',
    description: 'Annual neon-themed birthday party. BYOF (bring your own fits). Open bar for 21+.',
    location: {
      latitude: 36.11456789012345,
      longitude: -115.17123456789012,
      h3Index: latLngToH3Index(36.11456789012345, -115.17123456789012),
    },
  },
  {
    name: 'UNLV Anime Club Screening',
    organization: 'UNLV Anime Club',
    description:
      'Monthly screening night. This month: Frieren. Snacks provided, cosplay encouraged.',
    location: {
      latitude: 36.10678901234567,
      longitude: -115.14234567890123,
      h3Index: latLngToH3Index(36.10678901234567, -115.14234567890123),
    },
  },
];

// Attendee counts per event, parallel to eventSeeds — derived from userEventPairs in seed handler
export const eventSeedAttendees = [3, 5, 4, 4, 3, 5, 2, 4, 6];

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    //  Users (Convex Table Name: users)
    const userSeeds = [
      {
        name: 'superdynamitesnorkelboing',
        token: 'https://enough-walleye-4.clerk.accounts.dev|user_3C3gijmE4gWhUl7lj7OJTLJMkdT',
      },
      {
        name: 'eviljonah',
        token: 'https://enough-walleye-4.clerk.accounts.dev|user_3AIBlKxCpz6x7UnSfgAH9NTN6jw',
      },
      { name: 'Alice', token: 'seed|alice' },
      { name: 'Bob', token: 'seed|bob' },
      { name: 'Reece', token: 'seed|reece' },
      { name: 'Nathan', token: 'seed|nathan' },
      { name: 'Manjot', token: 'seed|manjot' },
      { name: 'Daniel', token: 'seed|daniel' },
      { name: 'Jonah', token: 'seed|jonah' },
      { name: 'Jimmy', token: 'seed|jimmy' },
      { name: 'Evan', token: 'seed|evan' },
    ];
    const userIds: any[] = [];
    for (const u of userSeeds) {
      const existing = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', u.token))
        .unique();
      userIds.push(
        existing?._id ?? (await ctx.db.insert('users', { name: u.name, clerkId: u.token }))
      );
    }
    const [u1, u2, u3, u4, u5, u6, u7, u8, u9] = userIds;

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
    for (const e of eventSeeds) {
      const existing = await ctx.db
        .query('events')
        .filter((q) => q.eq(q.field('name'), e.name))
        .first();
      eventIds.push(
        existing?._id ??
          (await ctx.db.insert('events', {
            ...e,
            startDate: Date.now() + 24 * 60 * 60 * 1000,
            endDate: Date.now() + 26 * 60 * 60 * 1000,
          }))
      );
    }
    const [e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17] = eventIds;

    //  Users/Events Join Table (Convex: usersToEvents)
    const userEventPairs: {
      userId: any;
      eventId: any;
      interactionType: 'attended' | 'interested' | 'blocked';
    }[] = [
      { userId: u1, eventId: e1, interactionType: 'attended' },
      { userId: u1, eventId: e5, interactionType: 'attended' },
      { userId: u1, eventId: e4, interactionType: 'attended' },
      { userId: u1, eventId: e3, interactionType: 'attended' },
      { userId: u1, eventId: e9, interactionType: 'attended' },

      { userId: u2, eventId: e2, interactionType: 'attended' },
      { userId: u2, eventId: e7, interactionType: 'attended' },
      { userId: u2, eventId: e1, interactionType: 'attended' },
      { userId: u2, eventId: e9, interactionType: 'attended' },

      { userId: u3, eventId: e2, interactionType: 'attended' },
      { userId: u3, eventId: e4, interactionType: 'attended' },
      { userId: u3, eventId: e8, interactionType: 'attended' },
      { userId: u3, eventId: e5, interactionType: 'attended' },

      { userId: u4, eventId: e3, interactionType: 'attended' },
      { userId: u4, eventId: e8, interactionType: 'attended' },
      { userId: u4, eventId: e7, interactionType: 'attended' },
      { userId: u4, eventId: e2, interactionType: 'attended' },
      { userId: u4, eventId: e5, interactionType: 'attended' },
      { userId: u4, eventId: e9, interactionType: 'attended' },

      { userId: u5, eventId: e6, interactionType: 'attended' },
      { userId: u5, eventId: e9, interactionType: 'attended' },

      { userId: u6, eventId: e2, interactionType: 'attended' },
      { userId: u6, eventId: e7, interactionType: 'attended' },
      { userId: u6, eventId: e8, interactionType: 'attended' },
      { userId: u6, eventId: e3, interactionType: 'attended' },
      { userId: u6, eventId: e6, interactionType: 'attended' },

      { userId: u7, eventId: e9, interactionType: 'attended' },
      { userId: u7, eventId: e8, interactionType: 'attended' },
      { userId: u7, eventId: e4, interactionType: 'attended' },
      { userId: u7, eventId: e3, interactionType: 'attended' },

      { userId: u8, eventId: e2, interactionType: 'attended' },
      { userId: u8, eventId: e4, interactionType: 'attended' },
      { userId: u8, eventId: e7, interactionType: 'attended' },
      { userId: u8, eventId: e8, interactionType: 'attended' },
      { userId: u8, eventId: e1, interactionType: 'attended' },
      { userId: u8, eventId: e6, interactionType: 'attended' },
      { userId: u8, eventId: e9, interactionType: 'attended' },

      { userId: u9, eventId: e4, interactionType: 'attended' },
      { userId: u9, eventId: e6, interactionType: 'attended' },
      { userId: u9, eventId: e2, interactionType: 'attended' },
      { userId: u9, eventId: e8, interactionType: 'attended' },

      // ── NEW: 'interested' interactions — user expressed interest but didn't attend
      //    Chosen to reflect each user's preferred tags (weak positive signal)
      { userId: u1, eventId: e8, interactionType: 'interested' }, // u1 likes chill/food — Water Lantern fits
      { userId: u1, eventId: e6, interactionType: 'interested' }, // curious about LVL UP
      { userId: u2, eventId: e4, interactionType: 'interested' }, // u2 likes music — First Friday fits
      { userId: u2, eventId: e3, interactionType: 'interested' }, // interested in party scene
      { userId: u3, eventId: e7, interactionType: 'interested' }, // u3 likes concerts
      { userId: u3, eventId: e9, interactionType: 'interested' }, // likes culture/art
      { userId: u4, eventId: e4, interactionType: 'interested' }, // u4 likes music/party
      { userId: u4, eventId: e6, interactionType: 'interested' }, // curious about convention
      { userId: u5, eventId: e2, interactionType: 'interested' }, // u5 likes music alongside anime
      { userId: u5, eventId: e4, interactionType: 'interested' }, // First Friday has vendors
      { userId: u6, eventId: e4, interactionType: 'interested' }, // u6 likes music/art
      { userId: u6, eventId: e9, interactionType: 'interested' }, // interested in thrift/culture
      { userId: u7, eventId: e6, interactionType: 'interested' }, // u7 likes vendors/culture — LVL UP has both
      { userId: u7, eventId: e2, interactionType: 'interested' }, // interested in rap scene
      { userId: u8, eventId: e5, interactionType: 'interested' }, // u8 likes culture/insightful — panel fits
      { userId: u8, eventId: e3, interactionType: 'interested' }, // interested in college scene
      { userId: u9, eventId: e7, interactionType: 'interested' }, // u9 likes music/concerts
      { userId: u9, eventId: e3, interactionType: 'interested' }, // curious about party

      // ── NEW: 'blocked' interactions — events the user explicitly doesn't want to see
      //    Chosen to be off-persona relative to each user's preferred tags
      { userId: u1, eventId: e2, interactionType: 'blocked' }, // u1 (study/culture) blocks rap concert
      { userId: u1, eventId: e7, interactionType: 'blocked' }, // blocks Baby Keem concert
      { userId: u2, eventId: e6, interactionType: 'blocked' }, // u2 (music/rap) blocks gaming convention
      { userId: u2, eventId: e5, interactionType: 'blocked' }, // blocks conference/panel
      { userId: u3, eventId: e3, interactionType: 'blocked' }, // u3 (art/culture) blocks frat party
      { userId: u3, eventId: e6, interactionType: 'blocked' }, // blocks gaming convention
      { userId: u4, eventId: e1, interactionType: 'blocked' }, // u4 (party/wild) blocks study session
      { userId: u4, eventId: e5, interactionType: 'blocked' }, // blocks conference
      { userId: u5, eventId: e3, interactionType: 'blocked' }, // u5 (anime/games) blocks frat party
      { userId: u5, eventId: e1, interactionType: 'blocked' }, // blocks study session
      { userId: u6, eventId: e1, interactionType: 'blocked' }, // u6 (music/wild) blocks study session
      { userId: u6, eventId: e5, interactionType: 'blocked' }, // blocks panel/conference
      { userId: u7, eventId: e2, interactionType: 'blocked' }, // u7 (thrift/fits) blocks rap concert
      { userId: u7, eventId: e7, interactionType: 'blocked' }, // blocks Baby Keem
      { userId: u8, eventId: e3, interactionType: 'blocked' }, // u8 (music/art) blocks frat party
      { userId: u8, eventId: e6, interactionType: 'blocked' }, // blocks gaming convention
      { userId: u9, eventId: e1, interactionType: 'blocked' }, // u9 (art/anime) blocks study session
      { userId: u9, eventId: e5, interactionType: 'blocked' }, // blocks panel/conference
    ];
    for (const pair of userEventPairs) {
      const existing = await ctx.db
        .query('usersToEvents')
        .filter((q) =>
          q.and(q.eq(q.field('userId'), pair.userId), q.eq(q.field('eventId'), pair.eventId))
        )
        .first();
      if (!existing) await ctx.db.insert('usersToEvents', pair);
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

      // ── NEW EVENT TAGS ──
      // e10: Chinatown Night Market — culture/food/vendors/chinatown/music
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
        title: 'Best late-night food near campus?',
        description: 'Drop your go-to spots.',
        authorId: u1,
      },
      {
        title: 'Top 5 matcha cafes across Las Vegas Chinatown.',
        description: 'Spoiler Alert: it aint Pop Cafe',
        authorId: u1,
      },
      {
        title: 'fight at first friday!!!',
        description: 'BROOOO THSI DUDE HIT HIM W A STOP SIGN',
        authorId: u3,
      },
      {
        title: 'Happy Birthday Shemes!!!',
        description: 'Go Psi Rho! Happy birthday to my big bro, the BIG 21!',
        authorId: u4,
      },
      {
        title: 'St Jimmy - A prodigy, a god-sent',
        description: 'A pinnacle of man. The way he orchestrates his words... Extraordinary...',
        authorId: u5,
      },
      {
        title: 'Need some anime recs / good music',
        description: 'i loveeee wallows and vinland saga',
        authorId: u7,
      },
      {
        title: 'Rate my cosplays! 1-10',
        description: 'be brutally honest, i spent 5 grand on all these cosplays',
        authorId: u7,
      },
      {
        title: 'met baby keem ?????',
        description:
          'i just saw this dude walking across caesars palace? asked for a pic but he spit in my face and started flying way :(',
        authorId: u8,
      },
      {
        title: 'FOMO Study Session',
        description: 'we are WINNING that competition',
        authorId: u9,
      },
      {
        title: 'anyone going to LVL UP this year?',
        description: 'first time going, dont know what to expect. do i need to cosplay??',
        authorId: u5,
      },
      {
        title: 'thrift valley haul just dropped',
        description:
          'grabbed a vintage carhartt and some cargos for $18 total. they are NOT out of stussy btw',
        authorId: u2,
      },
      {
        title: 'water lantern festival was so peaceful',
        description:
          'genuinely one of the most beautiful nights ive had in vegas. 10/10 would litter the pond again',
        authorId: u4,
      },
      {
        title: 'UNLV library or coffee shop for finals?',
        description: 'im cooked either way but where do yall go to grind',
        authorId: u9,
      },
      {
        title: 'chinatown food crawl this saturday',
        description: 'hitting 5 spots in one night. dm if you tryna pull up',
        authorId: u3,
      },
      {
        title: 'my first cosplay ever!!',
        description:
          'went as toji fushiguro and someone said i looked like a middle schooler in a costume... be kind',
        authorId: u5,
      },
      {
        title: 'baby keem setlist was CRAZY',
        description: 'homicide, trademark da baby, family ties back to back?? i blacked out',
        authorId: u8,
      },
      {
        title: 'first friday art picks this month',
        description:
          'saw some insane murals near the container park. the arts scene in dtlv is really coming up',
        authorId: u6,
      },
      {
        title: 'need a study group for calc 2',
        description:
          'series and sequences got me in a chokehold. anyone down to meet up at pop cafe?',
        authorId: u1,
      },
      {
        title: 'psi rho rush week recap',
        description: 'if you missed it you really missed it. brotherhood is unmatched fr',
        authorId: u4,
      },
    ];
    const postIds: any[] = [];
    for (const p of postSeeds) {
      const existing = await ctx.db
        .query('posts')
        .filter((q) => q.eq(q.field('title'), p.title))
        .first();
      postIds.push(existing?._id ?? (await ctx.db.insert('posts', p)));
    }
    const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19] =
      postIds;

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
    ];
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
      if (!existing) await ctx.db.insert('comments', comment);
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

    const userPreferredTagSeeds: { userId: any; tagIds: any[] }[] = [
      {
        userId: u1,
        tagIds: [
          tagIds['study'],
          tagIds['food'],
          tagIds['culture'],
          tagIds['college'],
          tagIds['insightful'],
        ],
      },
      {
        userId: u2,
        tagIds: [tagIds['music'], tagIds['concert'], tagIds['rap'], tagIds['r&b'], tagIds['chill']],
      },
      {
        userId: u3,
        tagIds: [
          tagIds['music'],
          tagIds['art'],
          tagIds['culture'],
          tagIds['concert'],
          tagIds['food'],
        ],
      },
      {
        userId: u4,
        tagIds: [
          tagIds['party'],
          tagIds['college'],
          tagIds['chill'],
          tagIds['drink'],
          tagIds['wild'],
        ],
      },
      {
        userId: u5,
        tagIds: [
          tagIds['anime'],
          tagIds['games'],
          tagIds['comics'],
          tagIds['convention'],
          tagIds['vendors'],
        ],
      },
      {
        userId: u6,
        tagIds: [tagIds['music'], tagIds['concert'], tagIds['rap'], tagIds['r&b'], tagIds['wild']],
      },
      {
        userId: u7,
        tagIds: [
          tagIds['thrift'],
          tagIds['fits'],
          tagIds['clothes'],
          tagIds['chill'],
          tagIds['culture'],
        ],
      },
      {
        userId: u8,
        tagIds: [
          tagIds['music'],
          tagIds['concert'],
          tagIds['art'],
          tagIds['food'],
          tagIds['culture'],
        ],
      },
      {
        userId: u9,
        tagIds: [tagIds['art'], tagIds['music'], tagIds['anime'], tagIds['comics'], tagIds['food']],
      },
    ];
    for (const entry of userPreferredTagSeeds) {
      const existing = await ctx.db
        .query('userPreferredTags')
        .withIndex('by_userId', (q) => q.eq('userId', entry.userId))
        .unique();
      if (!existing) await ctx.db.insert('userPreferredTags', entry);
    }

    return {
      users: userIds,
      event: eventIds,
      post: postIds,
      tags: tagIds,
    };
  },
});
