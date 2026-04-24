// ----------------------------------------------------
//  Convex helper functions for the attendance table.
// -----------------------------------------------------

import { query } from '../_generated/server';

// Unique user ids that have at least one row in `attendance` (i.e. attended an event).
// Ensures that getting all user ids doesn't break later recommendation steps, mainly for the
// similarity score logic as it would raise a KeyError. Can also be changed to get all user Ids in the future.
export const getUserIdsWithEventAttendance = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('attendance').collect();
    const uniqueUserIds = new Set<string>();
    for (const row of rows) {
      uniqueUserIds.add(row.userId);
    }
    return Array.from(uniqueUserIds);
  },
});
