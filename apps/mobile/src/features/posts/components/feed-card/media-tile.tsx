import { Image } from '@/components/image';
import { VideoPlayer } from '@/components/video';
import type { FeedPost } from '@/features/posts/types';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Pressable, Text, View } from 'react-native';

type MediaTileProps = {
  mediaId: FeedPost['mediaIds'][number] | undefined;
  className: string;
  overlayLabel?: string;
  onPress?: () => void;
};

export function MediaTile({ mediaId, className, overlayLabel, onPress }: MediaTileProps) {
  const file = useQuery(api.files.getFile, mediaId ? { storageId: mediaId } : 'skip');
  const mediaTypeResolved = file !== undefined;

  const inner = (
    <>
      {file?.isVideo ? (
        <VideoPlayer uri={file?.url} className="h-full w-full bg-black" showPlaybackToggle />
      ) : mediaTypeResolved && file?.url ? (
        <Image source={file.url} className="h-full w-full" contentFit="cover" />
      ) : (
        <View className="h-full w-full bg-surface-muted" />
      )}
      {overlayLabel ? (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <Text className="text-xl font-bold text-white">{overlayLabel}</Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`overflow-hidden rounded-xl bg-surface-muted ${className}`}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View className={`overflow-hidden rounded-xl bg-surface-muted ${className}`}>{inner}</View>
  );
}
