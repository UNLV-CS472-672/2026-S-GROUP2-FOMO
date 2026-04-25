import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type CaptureType = 'photo' | 'video';

type CaptureTypeToggleProps = {
  captureType: CaptureType;
  onChange: (type: CaptureType) => void;
  disabled?: boolean;
};

export function CaptureTypeToggle({ captureType, onChange, disabled }: CaptureTypeToggleProps) {
  const photoTabX = useSharedValue(0);
  const photoTabW = useSharedValue(0);
  const videoTabX = useSharedValue(0);
  const videoTabW = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(captureType === 'video' ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [captureType, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    width: photoTabW.value + (videoTabW.value - photoTabW.value) * progress.value,
    transform: [
      { translateX: photoTabX.value + (videoTabX.value - photoTabX.value) * progress.value },
    ],
    opacity: photoTabW.value > 0 ? 1 : 0,
  }));

  const press = (type: CaptureType) => {
    if (!disabled) onChange(type);
  };

  return (
    <View className="flex-row self-center rounded-full border border-border bg-surface/50 p-[3px]">
      <Animated.View
        pointerEvents="none"
        className="absolute bottom-[3px] left-0 top-[3px] rounded-full bg-primary"
        style={pillStyle}
      />
      <Pressable
        className="rounded-full px-4 py-2"
        onLayout={(e) => {
          photoTabX.value = e.nativeEvent.layout.x;
          photoTabW.value = e.nativeEvent.layout.width;
        }}
        onPress={() => press('photo')}
      >
        <Text
          className={
            captureType === 'photo'
              ? 'font-semibold text-primary-foreground'
              : 'font-semibold text-muted-foreground'
          }
        >
          Photo
        </Text>
      </Pressable>
      <Pressable
        className="rounded-full px-4 py-2"
        onLayout={(e) => {
          videoTabX.value = e.nativeEvent.layout.x;
          videoTabW.value = e.nativeEvent.layout.width;
        }}
        onPress={() => press('video')}
      >
        <Text
          className={
            captureType === 'video'
              ? 'font-semibold text-primary-foreground'
              : 'font-semibold text-muted-foreground'
          }
        >
          Video
        </Text>
      </Pressable>
    </View>
  );
}
