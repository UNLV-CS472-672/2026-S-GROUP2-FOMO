import type { UserIdentity as ClerkIdentity } from 'convex/server';

import { Doc } from './_generated/dataModel';
import { mutation, query, QueryCtx } from './_generated/server';

/**
 * Returns the current user's identity from the Convex JWT, or null if not signed in.
 * Used by the frontend to show auth status (e.g. green check vs red X).
 */
export const getIdentity = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.auth.getUserIdentity();
  },
});

export function clerkIdFromIdentity(identity: ClerkIdentity): string {
  return identity.tokenIdentifier;
}

export async function getClerkIdentity(ctx: QueryCtx): Promise<ClerkIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('No Clerk identity found');
  }

  return identity as ClerkIdentity;
}

async function getConvexUserRowForIdentity(
  ctx: QueryCtx,
  identity: ClerkIdentity
): Promise<Doc<'users'> | null> {
  const clerkId = clerkIdFromIdentity(identity);
  return await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
    .first();
}

/**
 * Best-effort lookup of the current Convex user row for this request.
 * Returns null when logged out or when the user row hasn't been created yet.
 *
 * This should not throw; it's safe to use in queries that must gracefully return `null`.
 */
export async function getAndAuthenticateCurrentConvexUserAllowNull(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return await getConvexUserRowForIdentity(ctx, identity);
}

/**
 * Resolves the current Clerk identity to a Convex user document.
 * This helper is strict: it throws when auth is missing or the user row does not exist.
 */
export async function __backend_only_getAndAuthenticateCurrentConvexUser(
  ctx: QueryCtx
): Promise<Doc<'users'>> {
  const user = await getAndAuthenticateCurrentConvexUserAllowNull(ctx);
  if (!user) {
    throw new Error('No Convex user found for the current Clerk token');
  }

  return user;
}

type GuestOrAuthenticatedUserTuple =
  | readonly [user: Doc<'users'>, guestMode: false]
  | readonly [user: null, guestMode: true];

/**
 * `[user, guestMode]` from Convex auth only: no JWT ⇒ guest browse; signed in ⇒ user row + not guest.
 */
export async function __backend_only_guestOrAuthenticatedUser(
  ctx: QueryCtx
): Promise<GuestOrAuthenticatedUserTuple> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return [null, true];
  }
  const user = await getConvexUserRowForIdentity(ctx, identity);
  if (!user) {
    throw new Error('No Convex user found for the current Clerk token');
  }
  return [user, false];
}

// Called from the client after sign-in so `users.getCurrentProfile` can resolve without manual DB fixes.
export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await getAndAuthenticateCurrentConvexUserAllowNull(ctx);
    if (existing) {
      return existing._id;
    }

    const identity = await getClerkIdentity(ctx);

    // New Clerk user: `clerkId` must match the stable id on `ctx.auth` (Clerk `clerkId` claim).
    return await ctx.db.insert('users', {
      name: identity.nickname!,
      clerkId: clerkIdFromIdentity(identity),
    });
  },
});
