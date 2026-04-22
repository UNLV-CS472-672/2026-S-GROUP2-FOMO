import { Image } from '@/components/image';
import { useEvent } from 'expo';
import type { VideoThumbnail as ExpoVideoThumbnail } from 'expo-video';
import { useVideoPlayer } from 'expo-video';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

const thumbnailCache = new Map<string, ExpoVideoThumbnail | null>();
const inFlightThumbnailRequests = new Map<string, Promise<ExpoVideoThumbnail | null>>();

type VideoThumbnailProps = {
  uri: string | null | undefined;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
  fallbackClassName?: string;
};

export function VideoThumbnail({
  uri,
  className,
  maxWidth = 512,
  maxHeight = 512,
  fallbackClassName,
}: VideoThumbnailProps) {
  const cacheKey = uri ? `${uri}:${maxWidth}:${maxHeight}` : null;
  const [thumbnail, setThumbnail] = useState<ExpoVideoThumbnail | null>(() =>
    cacheKey ? (thumbnailCache.get(cacheKey) ?? null) : null
  );
  const player = useVideoPlayer(uri ?? null);
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (!cacheKey) {
      setThumbnail(null);
      return;
    }

    setThumbnail(thumbnailCache.get(cacheKey) ?? null);
  }, [cacheKey]);

  useEffect(() => {
    if (!uri || !player || thumbnail) return;

    player.muted = true;
    player.pause();
    player.currentTime = 0;
  }, [player, thumbnail, uri]);

  useEffect(() => {
    if (!uri || !player || !cacheKey || status !== 'readyToPlay' || thumbnail) return;

    let cancelled = false;

    const existingRequest = inFlightThumbnailRequests.get(cacheKey);

    if (existingRequest) {
      void existingRequest.then((nextThumbnail) => {
        if (!cancelled) setThumbnail(nextThumbnail);
      });

      return () => {
        cancelled = true;
      };
    }

    const request = player
      .generateThumbnailsAsync([0], { maxHeight, maxWidth })
      .then((thumbnails) => {
        const nextThumbnail = thumbnails[0] ?? null;
        thumbnailCache.set(cacheKey, nextThumbnail);
        return nextThumbnail;
      })
      .catch((error) => {
        console.error('[VideoThumbnail] generateThumbnailsAsync failed', {
          uri,
          maxWidth,
          maxHeight,
          error,
        });
        thumbnailCache.set(cacheKey, null);
        return null;
      })
      .finally(() => {
        inFlightThumbnailRequests.delete(cacheKey);
      });

    inFlightThumbnailRequests.set(cacheKey, request);

    void request.then((nextThumbnail) => {
      if (!cancelled) setThumbnail(nextThumbnail);
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, maxHeight, maxWidth, player, status, thumbnail, uri]);

  if (thumbnail) {
    return <Image source={thumbnail} className={className} contentFit="cover" />;
  }

  return <View className={fallbackClassName ?? className ?? 'h-full w-full bg-black'} />;
}
