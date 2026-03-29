import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';

type FriendCellProps = {
  username: string;
  realName?: string;
  imageSource?: ImageSourcePropType;
  onPress?: () => void;
};

export default function FriendCell({ username, realName, imageSource, onPress }: FriendCellProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="flex-row items-center border-b border-neutral-200 py-3"
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${username}${realName ? `, ${realName}` : ''}`}
    >
      <View className="mr-3 border-2 border-app-border p-[2px]">
        {imageSource ? (
          <Image source={imageSource} className="h-10 w-10" />
        ) : (
          <View className="h-10 w-10 items-center justify-center bg-neutral-200">
            <Text className="text-lg font-bold text-app-icon">
              {username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-app-text">{username}</Text>
        {realName ? <Text className="text-sm text-muted-foreground">{realName}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}
