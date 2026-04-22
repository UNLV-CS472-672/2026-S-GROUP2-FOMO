import { DrawerModal } from '@/components/ui/drawer';
import { Avatar } from '@/features/posts/components/avatar';
import type { FeedComment, FeedPost } from '@/features/posts/types';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation } from 'convex/react';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

type ReplyTarget = { id: string; authorName: string } | null;

type Comment = FeedComment;

function CommentItem({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (target: NonNullable<ReplyTarget>) => void;
}) {
  const translateX = useSharedValue(0);

  const triggerReply = useCallback(() => {
    onReply({ id: comment.id, authorName: comment.authorName });
  }, [comment.id, comment.authorName, onReply]);

  const pan = Gesture.Pan()
    .activeOffsetX([10, Infinity])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.min(Math.max(e.translationX, 0), 72);
    })
    .onEnd(() => {
      if (translateX.value >= 60) {
        scheduleOnRN(triggerReply);
      }
      translateX.value = withTiming(0, { duration: 180 });
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 40, 60], [0, 0.5, 1]),
    transform: [{ scale: interpolate(translateX.value, [0, 60], [0.6, 1]) }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Animated.View style={[iconStyle, { position: 'absolute', left: 0 }]} pointerEvents="none">
          <Ionicons name="arrow-redo" size={18} color="#888" />
        </Animated.View>
        <Animated.View style={[rowStyle, { flex: 1 }]}>
          <View className="flex-row gap-2.5">
            <Avatar name={comment.authorName} size={32} />
            <View className="min-w-0 flex-1">
              <Text className="mb-0.5 text-[13px] font-semibold text-foreground">
                {comment.authorName}
              </Text>
              {comment.replyAuthorName ? (
                <Text className="mb-1 text-xs text-muted-foreground">
                  Replying to @{comment.replyAuthorName}
                </Text>
              ) : null}
              <Text className="text-sm leading-5 text-muted-foreground">{comment.text}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

function CommentComposer({
  onSubmit,
  readOnly,
  inputRef,
  replyTo,
  onCancelReply,
}: {
  onSubmit: (text: string) => void;
  readOnly: boolean;
  inputRef: RefObject<any>;
  replyTo: ReplyTarget;
  onCancelReply: () => void;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    onSubmit(text);
    setDraft('');
  }, [draft, onSubmit]);

  const paddingBottom = focused ? 10 : Math.max(insets.bottom, 28);

  return (
    <View className="border-t border-border bg-surface px-4 pt-2.5" style={{ paddingBottom }}>
      {replyTo && (
        <View className="mb-2 flex-row items-center justify-between rounded-lg bg-muted px-3 py-1.5">
          <View className="flex-row items-center gap-2.5">
            <Ionicons name="arrow-redo" size={18} color="#888" />
            <Text className="text-xs text-muted-foreground">
              Replying to{' '}
              <Text className="font-semibold text-foreground">{replyTo.authorName}</Text>
            </Text>
          </View>
          <Pressable onPress={onCancelReply} hitSlop={8}>
            <Ionicons name="close" size={14} color={theme.mutedText} />
          </Pressable>
        </View>
      )}
      {readOnly ? (
        <Text className="pb-12 text-center text-sm text-muted-foreground">
          Sign in to leave a comment.
        </Text>
      ) : (
        <View className="flex-row items-end gap-2">
          <BottomSheetTextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={replyTo ? `Reply to ${replyTo.authorName}...` : 'Add a comment...'}
            placeholderTextColor={theme.mutedText}
            multiline
            className="min-h-10 max-h-28 flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-[15px] text-foreground"
          />
          <Pressable
            onPress={submit}
            disabled={!draft.trim()}
            className="mb-px h-10 w-10 items-center justify-center rounded-full bg-primary"
            style={{ opacity: draft.trim() ? 1 : 0.35 }}
            accessibilityRole="button"
            accessibilityLabel="Send comment"
          >
            <Ionicons name="send" size={18} color={theme.tintForeground} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

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
