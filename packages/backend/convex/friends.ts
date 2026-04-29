import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type QueryCtx } from './_generated/server';
import { __backend_only_getAndAuthenticateCurrentConvexUser } from './auth';

type FriendshipDoc = Doc<'friends'>;
type FriendshipStatus = 'self' | 'none' | 'pending_sent' | 'pending_received' | 'accepted';

async function serializeFriendUser(ctx: QueryCtx, userId: Id<'users'>, requestedAt: number) {
  const user = await ctx.db.get(userId);
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    requestedAt,
  };
}

async function getFriendshipsForPair(
  ctx: QueryCtx,
  requesterId: Id<'users'>,
  recipientId: Id<'users'>
) {
  const [direct, reverse] = await Promise.all([
    ctx.db
      .query('friends')
      .withIndex('by_recipientId_requesterId', (q) =>
        q.eq('recipientId', recipientId).eq('requesterId', requesterId)
      )
      .collect(),
    ctx.db
      .query('friends')
      .withIndex('by_recipientId_requesterId', (q) =>
        q.eq('recipientId', requesterId).eq('requesterId', recipientId)
      )
      .collect(),
  ]);

  return { direct, reverse };
}

function pickFriendship(friendships: FriendshipDoc[]) {
  return (
    friendships.find((friendship) => friendship.status === 'accepted') ??
    friendships.find((friendship) => friendship.status === 'pending') ??
    friendships[0] ??
    null
  );
}

function getFriendshipStatus(
  direct: FriendshipDoc[],
  reverse: FriendshipDoc[],
  currentUserId: Id<'users'>,
  otherUserId: Id<'users'>
): FriendshipStatus {
  if (currentUserId === otherUserId) {
    return 'self';
  }

  const directFriendship = pickFriendship(direct);
  if (directFriendship?.status === 'accepted') {
    return 'accepted';
  }
  if (directFriendship?.status === 'pending') {
    return 'pending_sent';
  }

  const reverseFriendship = pickFriendship(reverse);
  if (reverseFriendship?.status === 'accepted') {
    return 'accepted';
  }
  if (reverseFriendship?.status === 'pending') {
    return 'pending_received';
  }

  return 'none';
}

export const getFriendshipStatusForUser = query({
  args: { otherUserId: v.id('users') },
  handler: async (ctx, { otherUserId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const { direct, reverse } = await getFriendshipsForPair(ctx, user._id, otherUserId);

    return {
      status: getFriendshipStatus(direct, reverse, user._id, otherUserId),
    };
  },
});

export const sendFriendRequest = mutation({
  args: { recipientId: v.id('users') },
  handler: async (ctx, { recipientId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const requesterId = user._id;

    if (requesterId === recipientId) {
      throw new Error('You cannot send a friend request to yourself');
    }

    const recipient = await ctx.db.get(recipientId);
    if (!recipient) {
      throw new Error('User not found');
    }

    const { direct, reverse } = await getFriendshipsForPair(ctx, requesterId, recipientId);
    const status = getFriendshipStatus(direct, reverse, requesterId, recipientId);

    if (status === 'accepted' || status === 'pending_sent' || status === 'pending_received') {
      return { status };
    }

    const existing = pickFriendship(direct) ?? pickFriendship(reverse);
    if (existing) {
      await ctx.db.patch(existing._id, {
        requesterId,
        recipientId,
        status: 'pending',
      });
      return { status: 'pending_sent' as const };
    }

    await ctx.db.insert('friends', {
      requesterId,
      recipientId,
      status: 'pending',
    });

    return { status: 'pending_sent' as const };
  },
});

export const acceptFriendRequest = mutation({
  args: { requesterId: v.id('users') },
  handler: async (ctx, { requesterId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);

    const pendingRequest = await ctx.db
      .query('friends')
      .withIndex('by_recipientId_requesterId', (q) =>
        q.eq('recipientId', user._id).eq('requesterId', requesterId)
      )
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .first();

    if (!pendingRequest) {
      throw new Error('Friend request not found');
    }

    await ctx.db.patch(pendingRequest._id, { status: 'accepted' });
    return { status: 'accepted' as const };
  },
});

export const declineFriendRequest = mutation({
  args: { requesterId: v.id('users') },
  handler: async (ctx, { requesterId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);

    const pendingRequest = await ctx.db
      .query('friends')
      .withIndex('by_recipientId_requesterId', (q) =>
        q.eq('recipientId', user._id).eq('requesterId', requesterId)
      )
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .first();

    if (!pendingRequest) {
      throw new Error('Friend request not found');
    }

    await ctx.db.patch(pendingRequest._id, { status: 'rejected' });
    return { status: 'rejected' as const };
  },
});

export const cancelFriendRequest = mutation({
  args: { recipientId: v.id('users') },
  handler: async (ctx, { recipientId }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);

    const pendingRequest = await ctx.db
      .query('friends')
      .withIndex('by_recipientId_requesterId', (q) =>
        q.eq('recipientId', recipientId).eq('requesterId', user._id)
      )
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .first();

    if (!pendingRequest) {
      throw new Error('Pending friend request not found');
    }

    await ctx.db.patch(pendingRequest._id, { status: 'rejected' });
    return { status: 'none' as const };
  },
});

export const getPendingFriendRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const requests = await ctx.db
      .query('friends')
      .withIndex('by_recipientId', (q) => q.eq('recipientId', user._id))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect();

    const requestUsers = await Promise.all(
      requests.map((request) =>
        serializeFriendUser(ctx, request.requesterId, request._creationTime)
      )
    );

    return requestUsers
      .filter((request): request is NonNullable<typeof request> => request !== null)
      .sort((a, b) => b.requestedAt - a.requestedAt);
  },
});

export const getFriendRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const [receivedRequests, sentRequests] = await Promise.all([
      ctx.db
        .query('friends')
        .withIndex('by_recipientId', (q) => q.eq('recipientId', user._id))
        .filter((q) => q.eq(q.field('status'), 'pending'))
        .collect(),
      ctx.db
        .query('friends')
        .withIndex('by_requesterId', (q) => q.eq('requesterId', user._id))
        .filter((q) => q.eq(q.field('status'), 'pending'))
        .collect(),
    ]);

    const [received, sent] = await Promise.all([
      Promise.all(
        receivedRequests.map((request) =>
          serializeFriendUser(ctx, request.requesterId, request._creationTime)
        )
      ),
      Promise.all(
        sentRequests.map((request) =>
          serializeFriendUser(ctx, request.recipientId, request._creationTime)
        )
      ),
    ]);

    return {
      received: received
        .filter((request): request is NonNullable<typeof request> => request !== null)
        .sort((a, b) => b.requestedAt - a.requestedAt),
      sent: sent
        .filter((request): request is NonNullable<typeof request> => request !== null)
        .sort((a, b) => b.requestedAt - a.requestedAt),
    };
  },
});
