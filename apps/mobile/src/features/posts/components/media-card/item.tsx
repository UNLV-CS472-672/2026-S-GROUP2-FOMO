import { Image } from '@/components/image';
import { VideoPlayer } from '@/components/video';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import type { ImageLoadEventData } from 'expo-image';
import { TouchableOpacity, View } from 'react-native';

type MediaItemProps = {
  mediaId: Id<'_storage'>;
  width: number;
  height: number;
  isActive: boolean;
  onPress: () => void;
  onNaturalSize?: (natW: number, natH: number) => void;
};

export function MediaItem({
  mediaId,
  width,
  height,
  isActive,
  onPress,
  onNaturalSize,
}: MediaItemProps) {
  const file = useQuery(api.files.getFile, { storageId: mediaId });
  const mediaTypeResolved = file !== undefined;

  function handleImageLoad(e: ImageLoadEventData) {
    onNaturalSize?.(e.source.width, e.source.height);
  }

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={{ width, height }}>
      <View style={{ width, height }} className="bg-black">
        {file?.isVideo ? (
          <VideoPlayer
            uri={file?.url}
            className="h-full w-full"
            contentFit="contain"
            isActive={isActive}
            showPlaybackToggle
          />
        ) : mediaTypeResolved && file?.url ? (
          <Image
            source={file.url}
            className="h-full w-full"
            contentFit="contain"
            onLoad={handleImageLoad}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
