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
