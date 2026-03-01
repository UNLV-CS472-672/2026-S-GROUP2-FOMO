import { mutation } from './_generated/server';

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Users
    const u1 = await ctx.db.insert('users', {
      name: 'Alice',
      tokenIdentifier: 'seed|alice', // fake
    });
    const u2 = await ctx.db.insert('users', {
      name: 'Bob',
      tokenIdentifier: 'seed|bob',
    });
    const u3 = await ctx.db.insert('users', {
      name: 'Reece',
      tokenIdentifier: 'seed|reece',
    });
    const u4 = await ctx.db.insert('users', {
      name: 'Nathan',
      tokenIdentifier: 'seed|nathan',
    });
    const u5 = await ctx.db.insert('users', {
      name: 'Manjot',
      tokenIdentifier: 'seed|manjot',
    });
    const u6 = await ctx.db.insert('users', {
      name: 'Daniel',
      tokenIdentifier: 'seed|daniel',
    });

    // Tags
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
      'birthday',
      'chinatown',
      'wild',
      'insightful',
      'drink',
    ];
    const tagIds: Record<string, any> = {};

    for (const name of tagNames) {
      // unique tags only
      const existing = await ctx.db
        .query('tags')
        .withIndex('by_name', (q) => q.eq('name', name))
        .unique();
      tagIds[name] = existing?._id ?? (await ctx.db.insert('tags', { name }));
    }

    // Events
    const now = Date.now();
    const e1 = await ctx.db.insert('events', {
      name: 'Coffee + Homework',
      organization: 'Pop Cafe',
      description: 'Chill study session.',
      startDate: now + 24 * 60 * 60 * 1000,
      endDate: now + 26 * 60 * 60 * 1000,
    });
    const e2 = await ctx.db.insert('events', {
      name: 'ASAP Rocky Concert',
      organization: 'ASAP Rocky',
      description: 'Dont be dumb, pull up.',
      startDate: now + 24 * 60 * 60 * 1000,
      endDate: now + 26 * 60 * 60 * 1000,
    });
    const e3 = await ctx.db.insert('events', {
      name: 'psi rho house party',
      organization: 'UNLV - Alpha Psi Rho',
      description: 'no hazing, just good vibes. $10 entry for dudes.',
      startDate: now + 24 * 60 * 60 * 1000,
      endDate: now + 26 * 60 * 60 * 1000,
    });
    const e4 = await ctx.db.insert('events', {
      name: 'Las Vegas - First Friday',
      organization: 'Downtown Las Vegas',
      description:
        'Free-admission monthly event featuring live music, art exhibits, food trucks, and vendors.',
      startDate: now + 24 * 60 * 60 * 1000,
      endDate: now + 26 * 60 * 60 * 1000,
    });
    const e5 = await ctx.db.insert('events', {
      name: 'St. Jimmy Panel & Conference',
      organization: 'st. jimmy',
      description:
        'okay jeez, i been going thru a rough patch. going left, right thru the catacombs.',
      startDate: now + 24 * 60 * 60 * 1000,
      endDate: now + 26 * 60 * 60 * 1000,
    });

    // Users interested in event
    await ctx.db.insert('usersToEvents', { userId: u1, eventId: e1 });
    await ctx.db.insert('usersToEvents', { userId: u1, eventId: e3 });
    await ctx.db.insert('usersToEvents', { userId: u1, eventId: e5 });

    await ctx.db.insert('usersToEvents', { userId: u2, eventId: e1 });

    await ctx.db.insert('usersToEvents', { userId: u3, eventId: e2 });
    await ctx.db.insert('usersToEvents', { userId: u3, eventId: e4 });

    await ctx.db.insert('usersToEvents', { userId: u4, eventId: e2 });
    await ctx.db.insert('usersToEvents', { userId: u4, eventId: e3 });
    await ctx.db.insert('usersToEvents', { userId: u4, eventId: e4 });

    await ctx.db.insert('usersToEvents', { userId: u5, eventId: e1 });
    await ctx.db.insert('usersToEvents', { userId: u5, eventId: e5 });

    await ctx.db.insert('usersToEvents', { userId: u6, eventId: e1 });
    await ctx.db.insert('usersToEvents', { userId: u6, eventId: e2 });
    await ctx.db.insert('usersToEvents', { userId: u6, eventId: e3 });
    await ctx.db.insert('usersToEvents', { userId: u6, eventId: e5 });

    // Event tags
    await ctx.db.insert('eventTags', { eventId: e1, tagId: tagIds['study'] });
    await ctx.db.insert('eventTags', { eventId: e1, tagId: tagIds['food'] });

    await ctx.db.insert('eventTags', { eventId: e2, tagId: tagIds['concert'] });
    await ctx.db.insert('eventTags', { eventId: e2, tagId: tagIds['music'] });
    await ctx.db.insert('eventTags', { eventId: e2, tagId: tagIds['rap'] });

    await ctx.db.insert('eventTags', { eventId: e3, tagId: tagIds['college'] });
    await ctx.db.insert('eventTags', { eventId: e3, tagId: tagIds['party'] });

    await ctx.db.insert('eventTags', { eventId: e4, tagId: tagIds['food'] });
    await ctx.db.insert('eventTags', { eventId: e4, tagId: tagIds['music'] });
    await ctx.db.insert('eventTags', { eventId: e4, tagId: tagIds['art'] });
    await ctx.db.insert('eventTags', { eventId: e4, tagId: tagIds['vendors'] });

    await ctx.db.insert('eventTags', { eventId: e5, tagId: tagIds['panel'] });
    await ctx.db.insert('eventTags', { eventId: e5, tagId: tagIds['conference'] });
    await ctx.db.insert('eventTags', { eventId: e5, tagId: tagIds['music'] });

    // Posts
    const p1 = await ctx.db.insert('posts', {
      title: 'Best late-night food near campus?',
      description: 'Drop your go-to spots.',
      authorId: u1,
    });

    const p2 = await ctx.db.insert('posts', {
      title: 'Top 5 matcha cafes across Las Vegas Chinatown.',
      description: 'Spoiler Alert: it aint Pop Cafe',
      authorId: u1,
    });

    const p3 = await ctx.db.insert('posts', {
      title: 'fight at first friday!!!',
      description: 'BROOOO THSI DUDE HIT HIM W A STOP SIGN',
      authorId: u3,
    });

    const p4 = await ctx.db.insert('posts', {
      title: 'Happy Birthday Shemes!!!',
      description: 'Go Psi Rho! Happy birthday to my big bro, the BIG 21!',
      authorId: u4,
    });

    const p5 = await ctx.db.insert('posts', {
      title: 'St Jimmy - A prodigy, a god-sent',
      description: 'A pinnacle of man. The way he orchestrates his words... Extraordinary...',
      authorId: u5,
    });

    // Post tags
    await ctx.db.insert('postTags', { postId: p1, tagId: tagIds['food'] });

    await ctx.db.insert('postTags', { postId: p2, tagId: tagIds['food'] });
    await ctx.db.insert('postTags', { postId: p2, tagId: tagIds['drink'] });
    await ctx.db.insert('postTags', { postId: p2, tagId: tagIds['study'] });
    await ctx.db.insert('postTags', { postId: p2, tagId: tagIds['chinatown'] });

    await ctx.db.insert('postTags', { postId: p3, tagId: tagIds['wild'] });

    await ctx.db.insert('postTags', { postId: p4, tagId: tagIds['party'] });
    await ctx.db.insert('postTags', { postId: p4, tagId: tagIds['college'] });
    await ctx.db.insert('postTags', { postId: p4, tagId: tagIds['birthday'] });

    await ctx.db.insert('postTags', { postId: p5, tagId: tagIds['insightful'] });

    // Comments
    await ctx.db.insert('comments', {
      postId: p1,
      authorId: u2,
      text: 'Gorilla Sushi!',
    });
    await ctx.db.insert('comments', {
      postId: p1,
      authorId: u4,
      text: 'used to be top sushi, went downhill tho',
    });
    await ctx.db.insert('comments', {
      postId: p1,
      authorId: u5,
      text: 'Chubby Cattle is fire! (smilehappy)',
    });

    await ctx.db.insert('comments', {
      postId: p2,
      authorId: u1,
      text: 'What did Pop Cafe do wrong lol',
    });
    await ctx.db.insert('comments', {
      postId: p2,
      authorId: u2,
      text: 'Im honestly shocked Airoma wasnt on the list.',
    });
    await ctx.db.insert('comments', {
      postId: p2,
      authorId: u4,
      text: 'i concur, pop cafe be cheeks',
    });
    await ctx.db.insert('comments', {
      postId: p2,
      authorId: u5,
      text: 'last time i had matcha bad things happen',
    });

    await ctx.db.insert('comments', {
      postId: p3,
      authorId: u1,
      text: 'OUCH!',
    });
    await ctx.db.insert('comments', {
      postId: p3,
      authorId: u3,
      text: 'straight for da noggin',
    });
    await ctx.db.insert('comments', {
      postId: p3,
      authorId: u6,
      text: 'I know that dude',
    });

    await ctx.db.insert('comments', {
      postId: p4,
      authorId: u1,
      text: 'HAPPY BIRTHDAY SHEMES',
    });
    await ctx.db.insert('comments', {
      postId: p4,
      authorId: u2,
      text: 'Thank you for the fun night!!',
    });

    await ctx.db.insert('comments', {
      postId: p5,
      authorId: u2,
      text: 'Hes so good at speaking it gave me amnesia.',
    });
    await ctx.db.insert('comments', {
      postId: p5,
      authorId: u5,
      text: 'Hes so good at speaking it gave me amnesia.',
    });
    await ctx.db.insert('comments', {
      postId: p5,
      authorId: u3,
      text: 'Amazing.',
    });
    await ctx.db.insert('comments', {
      postId: p5,
      authorId: u6,
      text: 'Revolutionary.',
    });

    return {
      users: [u1, u2, u3, u4, u5, u6],
      event: [e1, e2, e3, e4, e5],
      post: [p1, p2, p3, p4, p5],
      tags: tagIds,
    };
  },
});
