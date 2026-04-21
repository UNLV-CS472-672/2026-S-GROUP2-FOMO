import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  imageSource?: ImageSourcePropType;
  fallbackLabel?: string;
  onPress?: () => void;
};

export default function ProfilePicture({ imageSource, fallbackLabel = '?', onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View className="rounded-x1 border-2 border-border p-[2px]">
        {imageSource ? (
          <Image source={imageSource} className="h-23 w-23 rounded-x1" />
        ) : (
          <View className="h-23 w-23 items-center justify-center rounded-x1 bg-primary/10">
            <Text className="text-3xl font-bold text-foreground">
              {fallbackLabel.trim().charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
