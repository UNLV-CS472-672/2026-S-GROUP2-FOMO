import type { Id } from '@fomo/backend/convex/_generated/dataModel';

export type AttendanceStatus = 'going' | 'interested' | 'uninterested' | null;

export type NotificationPref = 'all' | 'friends' | 'none';

export type FeedComment = {
  id: string;
  text: string;
  authorName: string;
  creationTime: number;
  replyAuthorName?: string;
  parentId?: string;
  replies: FeedComment[];
};

export type FeedPost = {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  caption: string;
  likes: number;
  liked: boolean;
  mediaIds: Id<'_storage'>[];
  commentCount: number;
  comments: FeedComment[];
};
