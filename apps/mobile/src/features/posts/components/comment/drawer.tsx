import { DrawerModal } from '@/components/ui/drawer';
import type { FeedPost } from '@/features/posts/types';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useMutation } from 'convex/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CommentComposer } from './composer';
import { CommentItem, ReplyTarget } from './item';

type CommentDrawerProps = {
  open: boolean;
  onClose: () => void;
  post: FeedPost;
  readOnly: boolean;
};

export function CommentDrawer({ open, onClose, post, readOnly }: CommentDrawerProps) {
  const theme = useAppTheme();
  const { commentCount, comments } = post;
  const createComment = useMutation(api.comments.createComment);
  const inputRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const commentPositionsRef = useRef<Record<string, number>>({});
  const [replyTo, setReplyTo] = useState<ReplyTarget>(null);
  const [pendingScrollCommentId, setPendingScrollCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReplyTo(null);
      setPendingScrollCommentId(null);
      commentPositionsRef.current = {};
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!pendingScrollCommentId) {
      const timer = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      const y = commentPositionsRef.current[pendingScrollCommentId];
      if (typeof y === 'number') {
        scrollViewRef.current?.scrollTo({ y: Math.max(y - 24, 0), animated: true });
        setPendingScrollCommentId(null);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [commentCount, open, pendingScrollCommentId]);

  const handleReply = useCallback((target: NonNullable<ReplyTarget>) => {
    setReplyTo(target);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = useCallback(
    (text: string) => {
      const parentId = replyTo?.id as Id<'comments'> | undefined;
      void createComment({
        postId: post.id as Id<'posts'>,
        text,
        ...(parentId !== undefined && { parentId }),
      })
        .then((commentId) => {
          if (commentId) {
            setPendingScrollCommentId(String(commentId));
          }
        })
        .catch((err) => console.error('Failed to create comment', err));
      setReplyTo(null);
    },
    [createComment, post.id, replyTo]
  );

  return (
    <DrawerModal
      open={open}
      onClose={onClose}
      snapPoints={['90%']}
      enablePanDownToClose
      backdropAppearsOnIndex={0}
      backdropDisappearsOnIndex={-1}
      keyboardBehavior="extend"
    >
      <View className="flex-1">
        <View className="mx-6 mb-4 flex-row items-center gap-2.5">
          <Ionicons name="chatbubble-outline" size={18} color={theme.mutedText} />
          <Text className="text-[17px] font-bold text-foreground">Comments</Text>
          <Text
            className="text-[15px] text-muted-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {post.commentCount}
          </Text>
        </View>
        <BottomSheetScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {commentCount > 0 ? (
            <View className="gap-4">
              {comments.map((comment) => (
                <View
                  key={comment.id}
                  className="gap-3"
                  onLayout={(event) => {
                    commentPositionsRef.current[comment.id] = event.nativeEvent.layout.y;
                  }}
                >
                  <CommentItem comment={comment} onReply={handleReply} />
                  {comment.replies.length > 0 ? (
                    <View className="gap-3 pl-11">
                      {comment.replies.map((reply) => (
                        <View
                          key={reply.id}
                          onLayout={(event) => {
                            commentPositionsRef.current[reply.id] = event.nativeEvent.layout.y;
                          }}
                        >
                          <CommentItem comment={reply} onReply={handleReply} />
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">No comments yet. Be the first!</Text>
          )}
        </BottomSheetScrollView>

        <CommentComposer
          onSubmit={handleSubmit}
          readOnly={readOnly}
          inputRef={inputRef}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </View>
    </DrawerModal>
  );
}
