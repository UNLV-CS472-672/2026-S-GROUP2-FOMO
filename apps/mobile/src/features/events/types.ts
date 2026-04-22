import type { Id } from '@fomo/backend/convex/_generated/dataModel';

export type AttendanceStatus = 'going' | 'interested' | 'uninterested' | null;

export type NotificationPref = 'all' | 'friends' | 'none';

export type FeedPost = {
  id: string;
  author: string;
  title: string;
  description: string;
  authorName: string;
  likes: number;
  mediaId?: Id<'_storage'> | null;
  commentCount: number;
  matchedTagCount: number;
  comments: Array<{
    id: string;
    text: string;
    authorName: string;
  }>;
};
