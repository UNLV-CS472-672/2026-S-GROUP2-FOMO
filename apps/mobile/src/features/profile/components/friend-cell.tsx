import { Avatar } from '@/features/posts/components/avatar';
import { Text, TouchableOpacity, View } from 'react-native';

type FriendCellProps = {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  onPress?: () => void;
};

export function FriendCell({ username, displayName, avatarUrl, onPress }: FriendCellProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="flex-row items-center border-b border-border py-3"
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${username}${displayName ? `, ${displayName}` : ''}`}
    >
      <View className="mr-3">
        <Avatar
          name={displayName || username}
          size={40}
          source={avatarUrl ? { uri: avatarUrl } : undefined}
        />
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{username}</Text>
        {displayName ? <Text className="text-sm text-muted-foreground">{displayName}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}
