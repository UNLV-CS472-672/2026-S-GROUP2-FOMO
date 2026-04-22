import { Image, ImageSourcePropType, TouchableOpacity, View } from 'react-native';

type Props = {
  imageSource: ImageSourcePropType;
  onPress?: () => void;
};

export default function ProfilePicture({ imageSource, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View className="rounded-2xl border-2 border-border p-[2px]">
        <Image source={imageSource} className="h-23 w-23 rounded-2xl" />
      </View>
    </TouchableOpacity>
  );
}
