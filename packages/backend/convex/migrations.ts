import { Migrations } from '@convex-dev/migrations';
import { components } from './_generated/api.js';
import { DataModel } from './_generated/dataModel.js';

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const setDefaultUpdatedAt = migrations.define({
  table: 'attendance',
  migrateOne: async (ctx, doc) => {
    if (doc.updatedAt === undefined) {
      await ctx.db.patch(doc._id, { updatedAt: Date.now() });
    }
  },
});

export const setDefaultLastPostAt = migrations.define({
  table: 'events',
  migrateOne: async (ctx, doc) => {
    if (doc.lastPostAt === undefined) {
      const latestPost = await ctx.db
        .query('posts')
        .withIndex('by_event', (q) => q.eq('eventId', doc._id))
        .order('desc')
        .first();
      await ctx.db.patch(doc._id, { lastPostAt: latestPost?._creationTime ?? 0 });
    }
  },
});

export const setDefaultLastPostAtExternal = migrations.define({
  table: 'externalEvents',
  migrateOne: async (ctx, doc) => {
    if (doc.lastPostAt === undefined) {
      const latestPost = await ctx.db
        .query('posts')
        .withIndex('by_event', (q) => q.eq('eventId', doc._id))
        .order('desc')
        .first();
      await ctx.db.patch(doc._id, { lastPostAt: latestPost?._creationTime ?? 0 });
    }
  },
});
