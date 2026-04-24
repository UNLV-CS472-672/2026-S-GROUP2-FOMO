import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

type CommentButtonProps = {
  commentCount: number;
  onPress: () => void;
  iconSize?: number;
};

export function CommentButton({ commentCount, onPress, iconSize = 18 }: CommentButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-1.5" hitSlop={8}>
      <Ionicons name="chatbubble-outline" size={iconSize} color={theme.mutedText} />
      <Text className="text-[13px] text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
        {commentCount}
      </Text>
    </Pressable>
  );
}
