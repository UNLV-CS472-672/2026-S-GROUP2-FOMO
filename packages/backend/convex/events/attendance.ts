import { v } from 'convex/values';
import { Doc, Id } from '../_generated/dataModel';
import { mutation, query, QueryCtx } from '../_generated/server';
import {
  __backend_only_getAndAuthenticateCurrentConvexUser,
  __backend_only_guestOrAuthenticatedUser,
} from '../auth';

const attendanceStatusValidator = v.union(
  v.literal('going'),
  v.literal('interested'),
  v.literal('uninterested'),
  v.null()
);

const notificationPrefValidator = v.union(
  v.literal('all'),
  v.literal('friends'),
  v.literal('none')
);

function attendanceStatusFromRow(attendance: Doc<'attendance'> | null) {
  if (!attendance) {
    return null;
  }

  return attendance.status ?? 'going';
}

function notificationPrefFromRow(attendance: Doc<'attendance'> | null) {
  return attendance?.notification ?? 'all';
}

function countsAsAttendee(attendance: Doc<'attendance'>) {
  return (attendance.status ?? 'going') === 'going';
}

export async function getAttendeeCount(ctx: QueryCtx, eventId: Id<'events'>) {
  const attendees = await ctx.db
    .query('attendance')
    .withIndex('by_event', (q) => q.eq('eventId', eventId))
    .collect();

  return attendees.filter(countsAsAttendee).length;
}

export const getAttendeesByEventId = async (ctx: QueryCtx, eventId: Id<'events'>) => {
  const attendees = await ctx.db
    .query('attendance')
    .withIndex('by_event', (q) => q.eq('eventId', eventId))
    .collect();

  return attendees.filter(countsAsAttendee).map((attendee) => attendee.userId);
};

export const getViewerAttendance = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const [user, guestMode] = await __backend_only_guestOrAuthenticatedUser(ctx);
    if (guestMode || !user) {
      return { attendance: null, notification: 'all' as const };
    }

    const attendance = await ctx.db
      .query('attendance')
      .withIndex('by_user_event', (q) => q.eq('userId', user._id).eq('eventId', eventId))
      .first();

    return {
      attendance: attendanceStatusFromRow(attendance),
      notification: notificationPrefFromRow(attendance),
    };
  },
});

export const setViewerAttendance = mutation({
  args: {
    eventId: v.id('events'),
    attendance: attendanceStatusValidator,
    notification: notificationPrefValidator,
  },
  handler: async (ctx, { eventId, attendance, notification }) => {
    const user = await __backend_only_getAndAuthenticateCurrentConvexUser(ctx);
    const existingAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_user_event', (q) => q.eq('userId', user._id).eq('eventId', eventId))
      .first();

    if (attendance === null) {
      if (existingAttendance) {
        await ctx.db.delete(existingAttendance._id);
      }

      return { attendance: null, notification };
    }

    if (existingAttendance) {
      await ctx.db.patch(existingAttendance._id, { status: attendance, notification });
    } else {
      await ctx.db.insert('attendance', {
        userId: user._id,
        eventId,
        status: attendance,
        notification,
      });
    }

    return { attendance, notification };
  },
});
