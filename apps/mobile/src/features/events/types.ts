import type { Id } from '@fomo/backend/convex/_generated/dataModel';

export type AttendanceStatus = 'going' | 'interested' | 'uninterested' | null;

export type NotificationPref = 'all' | 'friends' | 'none';

export type FeedPost = {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  caption: string;
  likes: number;
  liked: boolean;
  mediaId?: Id<'_storage'> | null;
  commentCount: number;
  comments: Array<{
    id: string;
    text: string;
    authorName: string;
  }>;
};
