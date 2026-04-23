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
  const mediaUrl = useQuery(api.files.getUrl, { storageId: mediaId });
  const mediaMetadata = useQuery(api.files.getMetadata, { storageId: mediaId });
  const isVideo = mediaMetadata?.contentType?.startsWith('video/') ?? false;
  const mediaTypeResolved = mediaMetadata !== undefined;

  function handleImageLoad(e: ImageLoadEventData) {
    onNaturalSize?.(e.source.width, e.source.height);
  }

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={{ width, height }}>
      <View style={{ width, height }} className="bg-black">
        {isVideo ? (
          <VideoPlayer
            uri={mediaUrl}
            className="h-full w-full"
            contentFit="contain"
            isActive={isActive}
            showPlaybackToggle
          />
        ) : mediaTypeResolved && mediaUrl ? (
          <Image
            source={mediaUrl}
            className="h-full w-full"
            contentFit="contain"
            onLoad={handleImageLoad}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
