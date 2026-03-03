import { v } from 'convex/values';
import { query } from './_generated/server';

export const list = query({
  args: v.object({
    table_name: v.string(),
  }),
  handler: async (ctx, { table_name }) => {
    try {
      return await ctx.db.query(table_name).collect();
    } catch (error) {
      console.error('Error querying table:', table_name, error);
      throw new Error(`Failed to list records from ${table_name}`);
    }
  },
});
