import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

type LikeButtonProps = {
  liked: boolean;
  likes: number;
  readOnly: boolean;
  onPress: () => void;
  iconSize?: number;
};

export function LikeButton({ liked, likes, readOnly, onPress, iconSize = 20 }: LikeButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5"
      hitSlop={8}
      disabled={readOnly}
      style={{ opacity: readOnly ? 0.5 : 1 }}
    >
      <Ionicons
        name={liked ? 'heart' : 'heart-outline'}
        size={iconSize}
        color={liked ? '#FF4B6E' : theme.mutedText}
      />
      <Text className="text-[13px] text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
        {likes}
      </Text>
    </Pressable>
  );
}
