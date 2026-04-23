import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../convex/_generated/api';
import type { Doc } from '../convex/_generated/dataModel';
import schema from '../convex/schema';

const modules = import.meta.glob('../convex/**/*.ts');

function setup() {
  return convexTest(schema, modules);
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
        const id = await ctx.db.insert('users', {
          name: 'ghost',
          clerkId: 'token_ghost',
        });
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
        return await ctx.db.insert('users', {
          name: 'solo',
          clerkId: 'token_solo',
        });
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile).not.toBeNull();
      expect(profile!.user._id).toEqual(userId);
      expect(profile!.user.name).toBe('solo');
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
        const uid = await ctx.db.insert('users', {
          name: 'author',
          clerkId: 'token_author',
        });
        await ctx.db.insert('posts', {
          title: 'older',
          description: 'd',
          authorId: uid,
        });
        await ctx.db.insert('posts', {
          title: 'newer',
          description: 'd',
          authorId: uid,
        });
        return uid;
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.posts.map((p: Doc<'posts'>) => p.title)).toEqual(['newer', 'older']);
    });

    it('sorts comments by _creationTime descending (newest first)', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert('users', {
          name: 'commenter',
          clerkId: 'token_commenter',
        });
        const pid = await ctx.db.insert('posts', {
          title: 'p',
          description: 'd',
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

    it('loads events via usersToEvents and sorts them by startDate ascending', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert('users', {
          name: 'attendee',
          clerkId: 'token_attendee',
        });
        const later = await ctx.db.insert('events', {
          name: 'later',
          organization: 'o',
          description: 'd',
          startDate: 2000,
          endDate: 3000,
          location: { latitude: 0, longitude: 0, h3Index: 'h' },
        });
        const earlier = await ctx.db.insert('events', {
          name: 'earlier',
          organization: 'o',
          description: 'd',
          startDate: 1000,
          endDate: 1500,
          location: { latitude: 1, longitude: 1, h3Index: 'h' },
        });
        await ctx.db.insert('usersToEvents', {
          userId: uid,
          eventId: later,
          interactionType: 'attended',
        });
        await ctx.db.insert('usersToEvents', {
          userId: uid,
          eventId: earlier,
          interactionType: 'attended',
        });
        return uid;
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.events.map((e: Doc<'events'>) => e.name)).toEqual(['earlier', 'later']);
      expect(profile!.stats.eventCount).toBe(2);
    });

    it('drops attendee links when the event row was deleted', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert('users', {
          name: 'orphan-link',
          clerkId: 'token_orphan',
        });
        const eid = await ctx.db.insert('events', {
          name: 'gone',
          organization: 'o',
          description: 'd',
          startDate: 1,
          endDate: 2,
          location: { latitude: 0, longitude: 0, h3Index: 'h' },
        });
        await ctx.db.insert('usersToEvents', {
          userId: uid,
          eventId: eid,
          interactionType: 'attended',
        });
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
        const uid = await ctx.db.insert('users', {
          name: 'main',
          clerkId: 'token_main',
        });
        const kept = await ctx.db.insert('users', {
          name: 'kept',
          clerkId: 'token_kept',
        });
        const removed = await ctx.db.insert('users', {
          name: 'removed',
          clerkId: 'token_removed',
        });

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
      expect(profile!.recommendations[0].user.name).toBe('kept');
      expect(profile!.recommendations[0].score).toBe(0.9);
      expect(profile!.stats.recommendationCount).toBe(1);
    });

    it('returns no recommendations when there is no friendRecs document', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          name: 'no-recs',
          clerkId: 'token_no_recs',
        });
      });

      const profile = await t.query(api.users.getProfileById, { userId });

      expect(profile!.recommendations).toEqual([]);
      expect(profile!.stats.recommendationCount).toBe(0);
    });

    it('aggregates posts, comments, events, and recommendations together', async () => {
      const t = setup();

      const userId = await t.run(async (ctx) => {
        const uid = await ctx.db.insert('users', {
          name: 'full',
          clerkId: 'token_full',
        });
        const other = await ctx.db.insert('users', {
          name: 'friend',
          clerkId: 'token_friend',
        });
        const pid = await ctx.db.insert('posts', {
          title: 'only',
          description: 'post',
          authorId: uid,
        });
        await ctx.db.insert('comments', { postId: pid, authorId: uid, text: 'c1' });
        const eid = await ctx.db.insert('events', {
          name: 'e',
          organization: 'o',
          description: 'd',
          startDate: 5,
          endDate: 6,
          location: { latitude: 0, longitude: 0, h3Index: 'h8' },
        });
        await ctx.db.insert('usersToEvents', {
          userId: uid,
          eventId: eid,
          interactionType: 'attended',
        });
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
