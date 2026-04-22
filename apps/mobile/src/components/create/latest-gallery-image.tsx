import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type LatestGalleryImageProps = {
  onPress: () => void;
};

export function LatestGalleryImage({ onPress }: LatestGalleryImageProps) {
  const [latestUri, setLatestUri] = useState<string | null>(null);

  const loadLatestImage = useCallback(async () => {
    const currentPermission = await MediaLibrary.getPermissionsAsync();
    const permission = currentPermission.granted
      ? currentPermission
      : await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted) {
      setLatestUri(null);
      return;
    }

    const result = await MediaLibrary.getAssetsAsync({
      first: 1,
      mediaType: MediaLibrary.MediaType.photo,
      sortBy: [MediaLibrary.SortBy.creationTime],
    });

    setLatestUri(result.assets[0]?.uri ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadLatestImage();
    }, [loadLatestImage])
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open gallery"
      className="h-[54px] w-[54px] overflow-hidden rounded-xl border border-white/40 bg-black/55"
      onPress={onPress}
    >
      {latestUri ? (
        <Image
          source={{ uri: latestUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      ) : (
        <View className="flex-1 items-center justify-center px-1">
          <Text className="text-center text-[9px] font-semibold text-white">Gallery</Text>
        </View>
      )}
    </Pressable>
  );
}
