export type AttendanceStatus = 'going' | 'interested' | 'uninterested' | null;

export type NotificationPref = 'all' | 'friends' | 'none';

export type FeedPost = {
  id: string;
  title: string;
  description: string;
  authorName: string;
  commentCount: number;
  matchedTagCount: number;
  comments: Array<{
    id: string;
    text: string;
    authorName: string;
  }>;
};
