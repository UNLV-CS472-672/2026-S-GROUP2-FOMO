import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../convex/_generated/api';
import type { Doc } from '../convex/_generated/dataModel';
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
    displayName: 'Default',
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

describe('api.users', () => {
  describe('getCurrentProfile', () => {
    it('TODO', () => {
      // TODO
      expect(true).toBe(true);
    });
  });

  describe('getProfileByName', () => {
    it('TODO', () => {
      // TODO
      expect(true).toBe(true);
    });
  });

  describe('getProfileById', () => {
    it('returns null when the user row does not exist', async () => {
      const t = setup();

      const missingUserId = await t.run(async (ctx) => {
        const id = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_ghost', username: 'ghost', displayName: 'ghost' })
        );
        await ctx.db.delete(id);
        return id;
      });

      const profile = await t.query(api.users.getProfileById, {
        userId: missingUserId,
      });
      expect(profile).toBeNull();
    });

    it('returns an empty profile shape when the user has no related rows', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_solo', username: 'solo', displayName: 'solo' })
        );
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile).not.toBeNull();
      expect(profile!.user._id).toEqual(userId);
      expect(profile!.user.displayName).toBe('solo');
      expect(profile!.posts).toEqual([]);
      expect(profile!.comments).toEqual([]);
      expect(profile!.events).toEqual([]);
      expect(profile!.recommendations).toEqual([]);
      expect(profile!.stats).toEqual({
        postCount: 0,
        commentCount: 0,
        eventCount: 0,
        recommendationCount: 0,
      });
    });

    it('sorts posts by _creationTime descending (newest first)', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_author', username: 'author', displayName: 'author' })
        );
        await ctx.db.insert('posts', {
          caption: 'older',
          mediaIds: [],
          authorId: uid,
        });
        await ctx.db.insert('posts', {
          caption: 'newer',
          mediaIds: [],
          authorId: uid,
        });
        return uid;
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.posts.map((p: Doc<'posts'>) => p.caption)).toEqual(['newer', 'older']);
    });

    it('sorts comments by _creationTime descending (newest first)', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_commenter', username: 'commenter', displayName: 'commenter' })
        );
        const pid = await ctx.db.insert('posts', {
          caption: 'p',
          mediaIds: [],
          authorId: uid,
        });
        await ctx.db.insert('comments', { postId: pid, authorId: uid, text: 'first' });
        await ctx.db.insert('comments', { postId: pid, authorId: uid, text: 'second' });
        return uid;
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.comments.map((c: Doc<'comments'>) => c.text)).toEqual(['second', 'first']);
      expect(profile!.stats.commentCount).toBe(2);
    });

    it('loads events via attendance and sorts them by startDate ascending', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_attendee', username: 'attendee', displayName: 'attendee' })
        );
        const later = await ctx.db.insert(
          'events',
          makeEvent({
            name: 'later',
            startDate: 2000,
            endDate: 3000,
            location: { latitude: 0, longitude: 0, h3Index: 'h' },
          })
        );
        const earlier = await ctx.db.insert(
          'events',
          makeEvent({
            name: 'earlier',
            startDate: 1000,
            endDate: 1500,
            location: { latitude: 1, longitude: 1, h3Index: 'h' },
          })
        );
        await ctx.db.insert('attendance', { userId: uid, eventId: later });
        await ctx.db.insert('attendance', { userId: uid, eventId: earlier });
        return uid;
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.events.map((e: Doc<'events'>) => e.name)).toEqual(['earlier', 'later']);
      expect(profile!.stats.eventCount).toBe(2);
    });

    it('drops attendee links when the event row was deleted', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_orphan', username: 'orphan-link', displayName: 'orphan-link' })
        );
        const eid = await ctx.db.insert(
          'events',
          makeEvent({ name: 'gone', startDate: 1, endDate: 2 })
        );
        await ctx.db.insert('attendance', { userId: uid, eventId: eid });
        await ctx.db.delete(eid);
        return uid;
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.events).toEqual([]);
      expect(profile!.stats.eventCount).toBe(0);
    });

    it('returns friend recommendations with scores and omits missing users', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_main', username: 'main', displayName: 'main' })
        );
        const kept = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_kept', username: 'kept', displayName: 'kept' })
        );
        const removed = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_removed', username: 'removed', displayName: 'removed' })
        );

        await ctx.db.insert('friendRecs', {
          userId: uid,
          recs: [
            { userId: kept, score: 0.9 },
            { userId: removed, score: 0.7 },
          ],
          updatedAt: 1,
        });

        await ctx.db.delete(removed);

        return uid;
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.recommendations).toHaveLength(1);
      expect(profile!.recommendations[0].user.displayName).toBe('kept');
      expect(profile!.recommendations[0].score).toBe(0.9);
      expect(profile!.stats.recommendationCount).toBe(1);
    });

    it('returns no recommendations when there is no friendRecs document', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_no_recs', username: 'no-recs', displayName: 'no-recs' })
        );
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.recommendations).toEqual([]);
      expect(profile!.stats.recommendationCount).toBe(0);
    });

    it('aggregates posts, comments, events, and recommendations together', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_full', username: 'full', displayName: 'full' })
        );
        const other = await ctx.db.insert(
          'users',
          makeUser({ clerkId: 'token_friend', username: 'friend', displayName: 'friend' })
        );
        const pid = await ctx.db.insert('posts', {
          caption: 'only',
          mediaIds: [],
          authorId: uid,
        });
        await ctx.db.insert('comments', { postId: pid, authorId: uid, text: 'c1' });
        const eid = await ctx.db.insert(
          'events',
          makeEvent({
            name: 'e',
            startDate: 5,
            endDate: 6,
            location: { latitude: 0, longitude: 0, h3Index: 'h8' },
          })
        );
        await ctx.db.insert('attendance', { userId: uid, eventId: eid });
        await ctx.db.insert('friendRecs', {
          userId: uid,
          recs: [{ userId: other, score: 0.42 }],
          updatedAt: 2,
        });
        return uid;
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.stats).toEqual({
        postCount: 1,
        commentCount: 1,
        eventCount: 1,
        recommendationCount: 1,
      });
      expect(profile!.posts).toHaveLength(1);
      expect(profile!.comments).toHaveLength(1);
      expect(profile!.events).toHaveLength(1);
      expect(profile!.recommendations).toHaveLength(1);
    });
  });
});
