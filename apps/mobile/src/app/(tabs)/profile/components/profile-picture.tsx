import { Image, ImageSourcePropType, View } from 'react-native';

type Props = {
  imageSource: ImageSourcePropType;
};

export default function ProfilePicture({ imageSource }: Props) {
  return (
    <View className="rounded-xl border-2 border-app-border p-[2px]">
      <Image source={imageSource} className="h-23 w-23 rounded-xl" />
    </View>
  );
}
