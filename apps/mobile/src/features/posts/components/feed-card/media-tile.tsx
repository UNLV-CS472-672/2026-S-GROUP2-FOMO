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
  const mediaUrl = useQuery(api.files.getUrl, mediaId ? { storageId: mediaId } : 'skip');
  const mediaMetadata = useQuery(api.files.getMetadata, mediaId ? { storageId: mediaId } : 'skip');
  const mediaTypeResolved = mediaMetadata !== undefined;
  const isVideo = mediaMetadata?.contentType?.startsWith('video/') ?? false;

  const inner = (
    <>
      {isVideo ? (
        <VideoPlayer uri={mediaUrl} className="h-full w-full bg-black" showPlaybackToggle />
      ) : mediaTypeResolved && mediaUrl ? (
        <Image source={mediaUrl} className="h-full w-full" contentFit="cover" />
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
