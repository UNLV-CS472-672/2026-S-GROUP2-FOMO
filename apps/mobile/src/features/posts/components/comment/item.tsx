import { Avatar } from '@/features/posts/components/avatar';
import { FeedComment } from '@/features/posts/types';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export type ReplyTarget = { id: string; authorName: string } | null;

type CommentItemProps = {
  comment: FeedComment;
  readOnly: boolean;
  onReply: (target: NonNullable<ReplyTarget>) => void;
  onToggleLike: () => void;
};

export function CommentItem({ comment, readOnly, onReply, onToggleLike }: CommentItemProps) {
  const theme = useAppTheme();
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
    <View className="flex-row items-center gap-3">
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View
            style={[iconStyle, { position: 'absolute', left: 0 }]}
            pointerEvents="none"
          >
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
                {/* actual text */}
                <Text className="text-sm leading-5 text-muted-foreground">{comment.text}</Text>
                {/* below */}
                <View className="flex-row items-center gap-1.5">
                  {/* TODO :: timestamp */}
                  {/* comments beside */}
                  <Text
                    className="mt-1 text-[12px] text-muted-foreground"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {comment.likes > 0 ? `${comment.likes} likes` : ''}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
      <Pressable
        onPress={onToggleLike}
        className="w-6 items-center"
        hitSlop={8}
        disabled={readOnly}
        style={{ opacity: readOnly ? 0.5 : 1 }}
      >
        <Ionicons
          name={comment.liked ? 'heart' : 'heart-outline'}
          size={16}
          color={comment.liked ? '#FF4B6E' : theme.mutedText}
        />
      </Pressable>
    </View>
  );
}
