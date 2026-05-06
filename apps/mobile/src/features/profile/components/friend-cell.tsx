import { Avatar } from '@/features/posts/components/avatar';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type FriendCellProps = {
  username: string;
  avatarUrl?: string;
  onPress?: () => void;
  rightAccessory?: ReactNode;
  className?: string;
  showBorder?: boolean;
};

export function FriendCell({
  username,
  avatarUrl,
  onPress,
  rightAccessory,
  className,
  showBorder = true,
}: FriendCellProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={cn(
        'flex-row items-center py-3',
        showBorder && 'border-b border-border',
        className
      )}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={username}
    >
      <View className="mr-3">
        <Avatar name={username} size={40} source={avatarUrl ? { uri: avatarUrl } : undefined} />
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{username}</Text>
      </View>

      {rightAccessory ? <View className="ml-3">{rightAccessory}</View> : null}
    </TouchableOpacity>
  );
}
