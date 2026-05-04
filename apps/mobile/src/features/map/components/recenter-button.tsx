import { Icon } from '@/components/icon';
import { Pressable } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RecenterButtonProps = {
  disabled: boolean;
  animatedIndex: SharedValue<number>;
  animatedPosition: SharedValue<number>;
  onPress: () => void;
};

const BUTTON_SIZE = 48;
const BUTTON_GAP = 12;

export function RecenterButton({
  disabled,
  animatedIndex,
  animatedPosition,
  onPress,
}: RecenterButtonProps) {
  const insets = useSafeAreaInsets();
  const topInset = insets.top;
  const animatedStyle = useAnimatedStyle(() => {
    const top = Math.max(topInset + 16, animatedPosition.value - BUTTON_SIZE - BUTTON_GAP);

    return {
      top,
      opacity: interpolate(animatedIndex.value, [0, 1, 1.55, 2], [1, 1, 0.45, 0]),
    };
  }, [topInset]);

  return (
    <Animated.View
      className="absolute right-5"
      pointerEvents="box-none"
      style={[animatedStyle, disabled && { opacity: 0.55 }]}
    >
      <Pressable
        accessibilityLabel="Recenter map on your location"
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(0,0,0,0.08)', radius: 24 }}
        className="size-12 items-center justify-center rounded-full bg-card shadow-sm border border-border"
        disabled={disabled}
        hitSlop={10}
        style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] }]}
        onPress={onPress}
      >
        <Icon name="my-location" size={20} className="text-primary" />
      </Pressable>
    </Animated.View>
  );
}
