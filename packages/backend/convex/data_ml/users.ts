// ----------------------------------------------------
//  Convex helper functions for 'users' data table.
// -----------------------------------------------------

import { v } from 'convex/values';
import { query } from '../_generated/server';

// Checks if a user exists in "users" via id.
export const userExists = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Extracts all userIds from the `users` table.
export const getAllUserIds = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    return users.map((user) => user._id);
  },
});

// Given a "userId", return "name".
export const getNameById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.name ?? null;
  },
});

// Given a userId, return all accepted friend ids in either direction.
export const getFriendIds = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const [requestedFriends, receivedFriends] = await Promise.all([
      ctx.db
        .query('friends')
        .withIndex('by_requesterId', (q) => q.eq('requesterId', userId))
        .filter((q) => q.eq(q.field('status'), 'accepted'))
        .collect(),
      ctx.db
        .query('friends')
        .withIndex('by_recipientId', (q) => q.eq('recipientId', userId))
        .filter((q) => q.eq(q.field('status'), 'accepted'))
        .collect(),
    ]);

    return [
      ...requestedFriends.map((friend) => friend.recipientId),
      ...receivedFriends.map((friend) => friend.requesterId),
    ];
  },
});
