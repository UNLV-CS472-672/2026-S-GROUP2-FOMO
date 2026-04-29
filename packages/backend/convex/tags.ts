import { v } from 'convex/values';

import { mutation, query, type QueryCtx } from './_generated/server';
import {
  __backend_only_getAndAuthenticateCurrentConvexUser,
  __backend_only_getCurrentConvexUserAllowNull,
} from './auth';

const DEFAULT_TAG_LIMIT = 6;

async function getOrderedTags(ctx: QueryCtx) {
  return await ctx.db.query('tags').order('asc').collect();
}

export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const tags = await getOrderedTags(ctx);
    return tags.map((tag) => ({
      id: tag._id,
      name: tag.name,
    }));
  },
});

export const getCurrentUserTagPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await __backend_only_getCurrentConvexUserAllowNull(ctx);
    if (!user) {
      return null;
    }

    const [tags, existingPreferences] = await Promise.all([
      getOrderedTags(ctx),
      ctx.db
        .query('userTagPreferences')
        .withIndex('by_userId', (q) => q.eq('userId', user._id))
        .unique(),
    ]);

    const selectedTagIds = new Set(existingPreferences?.tags ?? []);

    return {
      hasCompletedSelection: existingPreferences !== null,
      tags: tags.map((tag) => ({
        id: tag._id,
        name: tag.name,
        selected: selectedTagIds.has(tag._id),
      })),
    };
  },
});

export const saveCurrentUserTagPreferences = mutation({
  args: {
    tagIds: v.array(v.id('tags')),
  },
  handler: async (ctx, { tagIds }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const tags = await getOrderedTags(ctx);
    const allowedTagIds = new Set(tags.map((tag) => tag._id));
    const selectedTagIds = tagIds.filter((tagId) => allowedTagIds.has(tagId));
    const existing = await ctx.db
      .query('userTagPreferences')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tags: selectedTagIds,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert('userTagPreferences', {
      userId: user._id,
      tags: selectedTagIds,
      updatedAt: Date.now(),
    });
  },
});

export const getPopularEventTags = query({
  args: {},
  handler: async (ctx) => {
    const eventTags = await ctx.db.query('eventTags').collect();
    const tagCounts = new Map<string, number>();

    for (const eventTag of eventTags) {
      const tag = await ctx.db.get(eventTag.tagId);

      if (!tag) {
        continue;
      }

      tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
    }

    return [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, DEFAULT_TAG_LIMIT)
      .map(([name, count]) => ({
        name,
        count,
      }));
  },
});
