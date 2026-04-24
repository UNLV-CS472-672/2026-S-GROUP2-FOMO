import { CommentDrawer } from '@/features/posts/components/comment/drawer';
import type { FeedPost } from '@/features/posts/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { View } from 'react-native';
import { CommentButton } from './comment-button';
import { LikeButton } from './like-button';

type PostActionsProps = {
  post: FeedPost;
  readOnly: boolean;
  onToggleLike: () => void;
  className?: string;
  likeIconSize?: number;
  commentIconSize?: number;
};

export function PostActions({
  post,
  readOnly,
  onToggleLike,
  className,
  likeIconSize,
  commentIconSize,
}: PostActionsProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  return (
    <>
      <CommentDrawer
        open={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        post={post}
        readOnly={readOnly}
      />

      <View className={cn('flex-row items-center gap-5', className)}>
        <LikeButton
          liked={post.liked}
          likes={post.likes}
          readOnly={readOnly}
          onPress={onToggleLike}
          iconSize={likeIconSize}
        />
        <CommentButton
          commentCount={post.commentCount}
          onPress={() => setIsCommentsOpen(true)}
          iconSize={commentIconSize}
        />
      </View>
    </>
  );
}
