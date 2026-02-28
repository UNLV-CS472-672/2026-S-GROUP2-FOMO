import { query } from "./_generated/server";

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
