import type { UserIdentity as ClerkIdentity } from 'convex/server';

import { Doc } from './_generated/dataModel';
import { QueryCtx } from './_generated/server';

function clerkIdFromIdentity(identity: ClerkIdentity): string {
  return identity.tokenIdentifier;
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
export async function __backend_only_getCurrentConvexUserAllowNull(ctx: QueryCtx) {
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
  const user = await __backend_only_getCurrentConvexUserAllowNull(ctx);
  if (!user) {
    throw new Error('No Convex user found for the current Clerk token');
  }

  return user;
}

type GuestOrAuthenticatedUserTuple =
  | readonly [user: Doc<'users'>, guestMode: false]
  | readonly [user: null, guestMode: true];

/**
 * `[user, guestMode]` from Convex auth only. Until user rows are guaranteed to exist
 * immediately after sign-in, missing Convex users fall back to guest browse.
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
    return [null, true];
  }
  return [user, false];
}
