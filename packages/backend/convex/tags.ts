import { query } from './_generated/server';

const DEFAULT_TAG_LIMIT = 6;

export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const tags = await ctx.db.query('tags').collect();
    return tags.map((tag) => ({
      id: tag._id,
      name: tag.name,
    }));
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
