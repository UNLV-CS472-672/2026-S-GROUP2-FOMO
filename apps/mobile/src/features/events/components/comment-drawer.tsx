import { DrawerModal } from '@/components/ui/drawer';
import { Avatar } from '@/features/events/components/avatar';
import type { FeedPost } from '@/features/events/types';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CommentComposer({
  onSubmit,
  readOnly,
  inputRef,
}: {
  onSubmit: (text: string) => void;
  readOnly: boolean;
  inputRef: React.RefObject<any>;
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
            placeholder="Add a comment..."
            placeholderTextColor={theme.mutedText}
            multiline
            className="min-h-10 max-h-28 flex-1 rounded-xl border border-border px-3 py-2 text-[15px] text-foreground bg-muted"
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

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
  }, [post.comments.length, open]);

  const handleSubmit = useCallback(
    (text: string) => {
      void createComment({ postId: post.id as Id<'posts'>, text }).catch((err) =>
        console.error('Failed to create comment', err)
      );
    },
    [createComment, post.id]
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
        <View className="flex-row items-center gap-2.5 mx-4 mb-4">
          <Ionicons name="chatbubble-outline" size={18} color={theme.mutedText} />
          <Text className=" text-[17px] font-bold text-foreground">Comments</Text>
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
                <View key={comment.id} className="flex-row gap-2.5">
                  <Avatar name={comment.authorName} size={32} />
                  <View className="min-w-0 flex-1">
                    <Text className="mb-0.5 text-[13px] font-semibold text-foreground">
                      {comment.authorName}
                    </Text>
                    <Text className="text-sm leading-5 text-muted-foreground">{comment.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">No comments yet. Be the first!</Text>
          )}
        </BottomSheetScrollView>

        <CommentComposer onSubmit={handleSubmit} readOnly={readOnly} inputRef={inputRef} />
      </View>
    </DrawerModal>
  );
}
