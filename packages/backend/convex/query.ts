import { v, Validator } from 'convex/values';
import { TableNames } from './_generated/dataModel';
import { query } from './_generated/server';

// Queries and returns the entire "table_name" table.
export const list = query({
  args: { table_name: v.string() as Validator<TableNames> },
  handler: async (ctx, { table_name }) => {
    try {
      return await ctx.db.query(table_name).collect();
    } catch (error) {
      console.error('Error querying table:', table_name, error);
      throw new Error(`Failed to list records from ${table_name}`);
    }
  },
});

// Checks if a user exists in "users" via tokenIdentifier.
export const user = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', name))
      .first();
  },
});

export const userId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});
