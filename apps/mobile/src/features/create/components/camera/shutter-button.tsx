import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type CaptureType = 'photo' | 'video';

type ShutterButtonProps = {
  captureType: CaptureType;
  isRecording: boolean;
  isBusy: boolean;
  onPress: () => void;
};

const TIMING_MODE = { duration: 220, easing: Easing.out(Easing.cubic) };
const TIMING_RECORD = { duration: 160, easing: Easing.inOut(Easing.quad) };

export function ShutterButton({ captureType, isRecording, isBusy, onPress }: ShutterButtonProps) {
  const videoProgress = useSharedValue(0);
  const recordingProgress = useSharedValue(0);

  useEffect(() => {
    videoProgress.value = withTiming(captureType === 'video' ? 1 : 0, TIMING_MODE);
  }, [captureType, videoProgress]);

  useEffect(() => {
    recordingProgress.value = withTiming(isRecording ? 1 : 0, TIMING_RECORD);
  }, [isRecording, recordingProgress]);

  const innerStyle = useAnimatedStyle(() => {
    const size = interpolate(recordingProgress.value, [0, 1], [54, 38]);
    // photo→video: 27→13, then video-idle→recording: 13→8
    const baseRadius = interpolate(videoProgress.value, [0, 1], [27, 13]);
    const radius = interpolate(recordingProgress.value, [0, 1], [baseRadius, 8]);
    const bg = interpolateColor(videoProgress.value, [0, 1], ['#ffffff', '#ef4444']);
    return { width: size, height: size, borderRadius: radius, backgroundColor: bg };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        captureType === 'photo'
          ? 'Capture photo'
          : isRecording
            ? 'Stop recording'
            : 'Start recording'
      }
      onPress={onPress}
      disabled={isBusy && !isRecording}
      className="h-21 w-21 items-center justify-center rounded-full border-4 border-white bg-white/15"
    >
      <Animated.View style={innerStyle} />
    </Pressable>
  );
}
