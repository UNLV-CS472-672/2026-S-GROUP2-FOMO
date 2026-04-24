import type { FeedPost } from '@/features/posts/types';
import { View } from 'react-native';
import { MediaTile } from './media-tile';

const MAX_SIZE = 4;
export function FeedCardMedia({
  mediaIds,
  onPressMedia,
}: {
  mediaIds: FeedPost['mediaIds'];
  onPressMedia: (index: number) => void;
}) {
  if (mediaIds.length === 0) return null;

  if (mediaIds.length === 1) {
    return (
      <MediaTile
        mediaId={mediaIds[0]!}
        className="h-[220px] w-full"
        onPress={() => onPressMedia(0)}
      />
    );
  }

  if (mediaIds.length === 2) {
    return (
      <View className="h-[220px] flex-row gap-2">
        <MediaTile mediaId={mediaIds[0]!} className="flex-1" onPress={() => onPressMedia(0)} />
        <MediaTile mediaId={mediaIds[1]!} className="flex-1" onPress={() => onPressMedia(1)} />
      </View>
    );
  }

  if (mediaIds.length === 3) {
    return (
      <View className="h-[240px] gap-2">
        <MediaTile
          mediaId={mediaIds[0]!}
          className="h-[148px] w-full"
          onPress={() => onPressMedia(0)}
        />
        <View className="flex-1 flex-row gap-2">
          <MediaTile mediaId={mediaIds[1]!} className="flex-1" onPress={() => onPressMedia(1)} />
          <MediaTile mediaId={mediaIds[2]!} className="flex-1" onPress={() => onPressMedia(2)} />
        </View>
      </View>
    );
  }

  const showOverlay = mediaIds.length > MAX_SIZE;

  return (
    <View className="h-[240px] gap-2">
      <View className="flex-1 flex-row gap-2">
        <MediaTile mediaId={mediaIds[0]!} className="flex-1" onPress={() => onPressMedia(0)} />
        <MediaTile mediaId={mediaIds[1]!} className="flex-1" onPress={() => onPressMedia(1)} />
      </View>
      <View className="flex-1 flex-row gap-2">
        <MediaTile mediaId={mediaIds[2]!} className="flex-1" onPress={() => onPressMedia(2)} />
        <MediaTile
          mediaId={mediaIds[3]!}
          className="flex-1"
          overlayLabel={showOverlay ? `+${mediaIds.length - MAX_SIZE}` : undefined}
          onPress={() => onPressMedia(3)}
        />
      </View>
    </View>
  );
}
