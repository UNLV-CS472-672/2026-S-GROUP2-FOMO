import { api } from '@fomo/backend/convex/_generated/api';
import { FunctionReturnType } from 'convex/server';

type Events = NonNullable<FunctionReturnType<typeof api.events.queries.getEvents>>;
type EventAttendees = NonNullable<
  FunctionReturnType<typeof api.events.attendance.getEventAttendees>
>;
type TopMediaPosts = NonNullable<FunctionReturnType<typeof api.events.queries.getTopMediaPosts>>;

export type EventAttendee = EventAttendees[number];
export type EventSummary = Events[number];
export type TopMediaPost = TopMediaPosts[number];

export type AttendanceStatus = 'going' | 'interested' | 'uninterested' | null;
export type NotificationPref = 'all' | 'friends' | 'none';
