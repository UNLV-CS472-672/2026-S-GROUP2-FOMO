import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer as useExpoVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

type AppVideoPlayerProps = {
  uri: string | null | undefined;
  className?: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'contain' | 'cover' | 'fill';
  nativeControls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  isActive?: boolean;
  resetWhenInactive?: boolean;
  showPlaybackToggle?: boolean;
};

export function VideoPlayer({
  uri,
  className,
  style,
  contentFit = 'cover',
  nativeControls = false,
  autoPlay = false,
  loop = false,
  muted = true,
  isActive = true,
  resetWhenInactive = false,
  showPlaybackToggle = false,
}: AppVideoPlayerProps) {
  const player = useExpoVideoPlayer(uri ?? null);
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    if (!uri || !player) return;

    player.loop = loop;
    player.muted = muted;

    if (!isActive) {
      player.pause();
      if (resetWhenInactive) player.currentTime = 0;
      return;
    }

    if (autoPlay) {
      player.play();
      return;
    }

    player.pause();
    if (resetWhenInactive) player.currentTime = 0;
  }, [autoPlay, isActive, loop, muted, player, resetWhenInactive, uri]);

  if (!uri || !player) {
    return <View className={className ?? 'h-full w-full bg-black'} style={style} />;
  }

  return (
    <View className={className} style={style}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit={contentFit}
        nativeControls={nativeControls}
        allowsVideoFrameAnalysis={false} // disable live text for iOS
      />
      {showPlaybackToggle ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();

            if (isPlaying) {
              player.pause();
              return;
            }

            player.play();
          }}
          hitSlop={8}
          className="absolute bottom-2 right-2 rounded-full bg-black/55 p-2"
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}
