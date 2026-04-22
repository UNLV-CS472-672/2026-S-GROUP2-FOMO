import { Avatar } from '@/features/posts/components/avatar';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useCallback, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type PostDetailsCommentVM = {
  id: string;
  author: string;
  text: string;
  authorAvatarSrc?: ImageSourcePropType;
};

export type PostDetailsViewModel = {
  id: string;
  image?: ImageSourcePropType;
  authorName: string;
  authorAvatarSrc?: ImageSourcePropType;
  caption?: string;
  likes: number;
  commentCount: number;
  comments: PostDetailsCommentVM[];
  footerHint?: string;
};

type PostDetailsViewProps = {
  model: PostDetailsViewModel;
  onSubmitComment?: (text: string) => void;
  footerHint?: string;
};

export function PostDetailsView({ model, onSubmitComment, footerHint }: PostDetailsViewProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [draft, setDraft] = useState('');

  const submit = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || !onSubmitComment) {
      return;
    }

    onSubmitComment(trimmed);
    setDraft('');
  }, [draft, onSubmitComment]);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {model.image ? (
          <View className="aspect-square w-full bg-surface-muted">
            <Image source={model.image} className="h-full w-full" resizeMode="cover" />
          </View>
        ) : null}

        <View className="gap-3 border-b border-border px-4 py-4">
          <View className="flex-row items-center gap-2.5">
            <Avatar source={model.authorAvatarSrc} size={40} name={model.authorName} />
            <Text className="text-base font-semibold text-foreground">{model.authorName}</Text>
          </View>

          {model.caption ? (
            <Text className="text-[15px] leading-[22px] text-foreground">{model.caption}</Text>
          ) : null}

          <Text
            className="text-[13px] text-muted-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {model.likes} likes · {model.commentCount} comments
          </Text>
        </View>

        <View className="px-4 pt-4">
          <Text className="mb-3 text-base font-bold text-foreground">Comments</Text>
          {model.comments.length > 0 ? (
            <View className="gap-3">
              {model.comments.map((comment) => (
                <View key={comment.id} className="flex-row gap-3">
                  <Avatar source={comment.authorAvatarSrc} size={36} name={comment.author} />
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold text-foreground">{comment.author}</Text>
                    <Text className="mt-0.5 text-sm leading-5 text-muted-foreground">
                      {comment.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">No comments yet.</Text>
          )}
        </View>
      </ScrollView>

      <View
        className="border-t border-border bg-background px-4 pt-3"
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: theme.background,
        }}
      >
        {onSubmitComment ? (
          <View className="flex-row items-end gap-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Add a comment..."
              placeholderTextColor={theme.mutedText}
              className="max-h-28 min-h-10 flex-1 rounded-xl border border-border px-3 py-2 text-[15px] text-foreground"
              style={{ borderCurve: 'continuous' }}
              multiline
              textAlignVertical="top"
              onSubmitEditing={submit}
            />
            <Pressable
              onPress={submit}
              disabled={!draft.trim()}
              className="mb-0.5 h-10 w-10 items-center justify-center rounded-full"
              style={{
                opacity: draft.trim() ? 1 : 0.35,
                backgroundColor: theme.tint,
              }}
              accessibilityRole="button"
              accessibilityLabel="Send comment"
            >
              <Ionicons name="send" size={18} color={theme.tintForeground} />
            </Pressable>
          </View>
        ) : (
          <Text className="text-sm text-muted-foreground">
            {footerHint ?? model.footerHint ?? 'Add a comment'}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

type PostDetailsNotFoundProps = {
  message?: string;
};

export function PostDetailsNotFound({
  message = 'This post could not be found.',
}: PostDetailsNotFoundProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-center text-base text-muted-foreground">{message}</Text>
    </View>
  );
}
