import { Image } from '@/components/image';
import { VideoPlayer } from '@/components/video';
import { Pressable, Text, View } from 'react-native';

type ResolvedFile = { url: string | null; isVideo: boolean } | null | undefined;

type MediaTileProps = {
  file: ResolvedFile;
  className: string;
  overlayLabel?: string;
  onPress?: () => void;
};

export function MediaTile({ file, className, overlayLabel, onPress }: MediaTileProps) {
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
