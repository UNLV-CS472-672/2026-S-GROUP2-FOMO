// -----------------------------------------------
//  Convex helper functions for ALL data tables.
// -----------------------------------------------

import { v, Validator } from 'convex/values';
import { TableNames } from '../_generated/dataModel';
import { internalQuery } from '../_generated/server';

// Queries and returns the entire table based on "table_name" input.
export const queryAll = internalQuery({
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
