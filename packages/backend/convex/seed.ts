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

    // Tags
    const tagNames = ['music', 'food', 'study'];
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

    // Users interested in event
    await ctx.db.insert('usersToEvents', { userId: u1, eventId: e1 });
    await ctx.db.insert('usersToEvents', { userId: u2, eventId: e1 });

    // Event tags
    await ctx.db.insert('eventTags', { eventId: e1, tagId: tagIds['study'] });
    await ctx.db.insert('eventTags', { eventId: e1, tagId: tagIds['food'] });

    // Posts
    const p1 = await ctx.db.insert('posts', {
      title: 'Best late-night food near campus?',
      description: 'Drop your go-to spots.',
      authorId: u1,
    });

    // Post tags
    await ctx.db.insert('postTags', { postId: p1, tagId: tagIds['food'] });

    // Comments
    await ctx.db.insert('comments', {
      postId: p1,
      authorId: u2,
      text: 'Gorilla Sushi!',
    });

    return {
      users: [u1, u2],
      event: e1,
      post: p1,
      tags: tagIds,
    };
  },
});
