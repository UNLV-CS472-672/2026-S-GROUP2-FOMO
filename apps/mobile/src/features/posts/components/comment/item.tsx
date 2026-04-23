import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { FeedComment } from '../../types';
import { Avatar } from '../avatar';

export type ReplyTarget = { id: string; authorName: string } | null;

type CommentItemProps = {
  comment: FeedComment;
  onReply: (target: NonNullable<ReplyTarget>) => void;
};

export function CommentItem({ comment, onReply }: CommentItemProps) {
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
