import { Image, Text, TouchableOpacity, View } from 'react-native';

type FriendCellProps = {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  onPress?: () => void;
};

export default function FriendCell({ username, displayName, avatarUrl, onPress }: FriendCellProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="flex-row items-center border-b border-border py-3"
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${username}${displayName ? `, ${displayName}` : ''}`}
    >
      <View className="mr-3 border-2 border-border p-[2px]">
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="h-10 w-10" />
        ) : (
          <View className="h-10 w-10 items-center justify-center bg-primary-soft">
            <Text className="text-lg font-bold text-muted-foreground">
              {username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{username}</Text>
        {displayName ? <Text className="text-sm text-muted-foreground">{displayName}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}
