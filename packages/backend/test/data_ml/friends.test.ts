import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.ts');

function setup() {
  return convexTest(schema, modules);
}

function userDoc(name: string, clerkId: string) {
  return {
    bio: '',
    clerkId,
    username: name,
    avatarUrl: '',
  };
}

describe('api["data_ml/friends"]', () => {
  describe('friendExists', () => {
    it('returns the requested user id for accepted current-shape friendships in either direction', async () => {
      const t = setup();

      const { userAId, userBId } = await t.run(async (ctx) => {
        const userAId = await ctx.db.insert('users', userDoc('a', 'a'));
        const userBId = await ctx.db.insert('users', userDoc('b', 'b'));
        await ctx.db.insert('friends', {
          requesterId: userAId,
          recipientId: userBId,
          status: 'accepted',
        });
        return { userAId, userBId };
      });

      await expect(
        t.query(api['data_ml/friends'].friendExists, { userAId, userBId })
      ).resolves.toBe(userBId);
      await expect(
        t.query(api['data_ml/friends'].friendExists, { userAId: userBId, userBId: userAId })
      ).resolves.toBe(userAId);
    });

    it('ignores current-shape friendships that are not accepted', async () => {
      const t = setup();

      const { userAId, userBId } = await t.run(async (ctx) => {
        const userAId = await ctx.db.insert('users', userDoc('a', 'a'));
        const userBId = await ctx.db.insert('users', userDoc('b', 'b'));
        await ctx.db.insert('friends', {
          requesterId: userAId,
          recipientId: userBId,
          status: 'pending',
        });
        return { userAId, userBId };
      });

      await expect(
        t.query(api['data_ml/friends'].friendExists, { userAId, userBId })
      ).resolves.toBe(null);
    });
  });

  describe('getFriendRecs', () => {
    it('TODO', () => {
      // TODO
      expect(true).toBe(true);
    });
  });
});
