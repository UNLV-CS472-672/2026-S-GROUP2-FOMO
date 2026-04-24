import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { RefObject, useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReplyTarget } from './item';

export function CommentComposer({
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
