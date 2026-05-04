import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

const modules = import.meta.glob('../convex/**/*.ts');

function setup() {
  return convexTest(schema, modules);
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    bio: '',
    clerkId: 'token_default',
    username: 'default',
    avatarUrl: '',
    ...overrides,
  };
}

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    name: 'event',
    caption: '',
    startDate: 1000,
    endDate: 2000,
    location: { latitude: 0, longitude: 0, h3Index: 'h' },
    hostIds: [],
    ...overrides,
  };
}

describe('api.moderation.report', () => {
  it('hides a reported post only for the reporting user', async () => {
    const t = setup();

    const { authorId, postId, eventId } = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert(
        'users',
        makeUser({ clerkId: 'token_author', username: 'author' })
      );
      await ctx.db.insert('users', makeUser({ clerkId: 'token_reporter', username: 'reporter' }));
      await ctx.db.insert('users', makeUser({ clerkId: 'token_other', username: 'other' }));

      const eventId = await ctx.db.insert('events', makeEvent({ hostIds: [authorId] }));
      const postId = await ctx.db.insert('posts', {
        caption: 'reported post',
        mediaIds: [],
        authorId,
        eventId,
      });

      return { authorId, postId, eventId };
    });

    await t
      .withIdentity({ tokenIdentifier: 'token_reporter' })
      .mutation(api.moderation.report.reportPost, {
        postId,
        reason: 'Spam',
      });

    const reporterEventFeed = await t
      .withIdentity({ tokenIdentifier: 'token_reporter' })
      .query(api.events.queries.getEventFeed, { eventId });

    const reporterProfileFeed = await t
      .withIdentity({ tokenIdentifier: 'token_reporter' })
      .query(api.users.getProfileFeed, { userId: authorId });

    const otherViewerEventFeed = await t
      .withIdentity({ tokenIdentifier: 'token_other' })
      .query(api.events.queries.getEventFeed, { eventId });

    const otherViewerProfileFeed = await t
      .withIdentity({ tokenIdentifier: 'token_other' })
      .query(api.users.getProfileFeed, { userId: authorId });

    expect(reporterEventFeed.map((post) => post.id)).not.toContain(postId);
    expect(reporterProfileFeed.map((post) => post.id)).not.toContain(postId);
    expect(otherViewerEventFeed.map((post) => post.id)).toContain(postId);
    expect(otherViewerProfileFeed.map((post) => post.id)).toContain(postId);
  });
});
