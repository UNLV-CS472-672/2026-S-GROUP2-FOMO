import { Icon } from '@/components/icon';
import {
  CREATE_CAMERA_CROSSFADE_END,
  CREATE_CAMERA_CROSSFADE_START,
} from '@/features/create/constants';
import { useAppTheme } from '@/lib/use-app-theme';
import { ActivityIndicator, Pressable } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTION_BUTTON_SIZE = 48;
const ACTION_BUTTON_GAP = 12;

type CreateSubmitButtonProps = {
  isEventMode: boolean;
  animatedIndex: SharedValue<number>;
  animatedPosition: SharedValue<number>;
  onPress: () => void;
  disabled?: boolean;
};

export function CreateSubmitButton({
  isEventMode,
  animatedIndex,
  animatedPosition,
  onPress,
  disabled = false,
}: CreateSubmitButtonProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const top = Math.max(
      insets.top + 16,
      animatedPosition.value - ACTION_BUTTON_SIZE - ACTION_BUTTON_GAP
    );

    return {
      top,
      opacity: interpolate(
        animatedIndex.value,
        [CREATE_CAMERA_CROSSFADE_START, CREATE_CAMERA_CROSSFADE_END],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  }, [insets.top]);

  return (
    <Animated.View className="absolute right-5" pointerEvents="box-none" style={animatedStyle}>
      <Pressable
        accessibilityLabel={isEventMode ? 'Create event' : 'Create post'}
        accessibilityRole="button"
        className="size-12 items-center justify-center rounded-full bg-card shadow-sm border border-border"
        hitSlop={10}
        disabled={disabled}
        style={({ pressed }) => [
          pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
          disabled && { opacity: 0.5 },
        ]}
        onPress={onPress}
      >
        {disabled ? (
          <ActivityIndicator size="small" color={theme.tint} />
        ) : (
          <Icon
            name={isEventMode ? 'event-available' : 'add'}
            size={isEventMode ? 20 : 25}
            className="text-primary"
          />
        )}
      </Pressable>
    </Animated.View>
  );
}
