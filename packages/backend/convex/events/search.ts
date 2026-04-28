import { v } from 'convex/values';

import { query } from '../_generated/server';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 25;

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
}

export const search = query({
  args: {
    query: v.optional(v.string()),
    h3Index: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = normalizeLimit(args.limit);
    const searchTerm = args.query?.trim() ?? '';
    const h3Index = args.h3Index?.trim() ?? '';

    if (searchTerm && h3Index) {
      return await ctx.db
        .query('events')
        .withSearchIndex('search_name', (q) =>
          q.search('name', searchTerm).eq('location.h3Index', h3Index)
        )
        .take(limit);
    }

    if (searchTerm) {
      return await ctx.db
        .query('events')
        .withSearchIndex('search_name', (q) => q.search('name', searchTerm))
        .take(limit);
    }

    if (h3Index) {
      return await ctx.db
        .query('events')
        .withIndex('by_h3Index', (q) => q.eq('location.h3Index', h3Index))
        .take(limit);
    }

    return await ctx.db
      .query('events')
      .withIndex('by_startDate', (q) => q.gte('startDate', Date.now()))
      .take(limit);
  },
});
