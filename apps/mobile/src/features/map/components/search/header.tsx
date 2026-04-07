import { Icon } from '@/components/icon';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

interface SearchHeaderProps {
  query: string;
  placeholderTextColor: string;
  animatedIndex?: SharedValue<number>;
  onChangeQuery: (value: string) => void;
  onCancel: () => void;
  onExpand: () => void;
}

export function SearchHeader({
  query,
  placeholderTextColor,
  animatedIndex,
  onChangeQuery,
  onCancel,
  onExpand,
}: SearchHeaderProps) {
  const fallbackAnimatedIndex = useSharedValue(0);
  const resolvedAnimatedIndex = animatedIndex ?? fallbackAnimatedIndex;
  const progress = useAnimatedStyle(() => {
    const cancelProgress = interpolate(
      resolvedAnimatedIndex.value,
      [1.6, 2],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: cancelProgress,
      transform: [{ scale: interpolate(cancelProgress, [0, 1], [0.01, 1], Extrapolation.CLAMP) }],
    };
  });

  const inputAnimatedStyle = useAnimatedStyle(() => {
    const cancelProgress = interpolate(
      resolvedAnimatedIndex.value,
      [1.6, 2],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      marginRight: interpolate(cancelProgress, [0, 1], [0, 56], Extrapolation.CLAMP),
    };
  });

  return (
    <View className="relative z-10 mx-4 mt-2 mb-8">
      <Animated.View style={inputAnimatedStyle}>
        <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 pb-4">
          <Icon name="search" size={24} className="text-muted-foreground" />
          <BottomSheetTextInput
            value={query}
            onChangeText={onChangeQuery}
            onPressIn={onExpand}
            onFocus={onExpand}
            placeholder="Search places, events, or vibes"
            placeholderTextColor={placeholderTextColor}
            className="flex-1 text-base text-foreground"
            accessibilityLabel="Search events or places"
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              className="items-center justify-center rounded-full "
              hitSlop={8}
              onPress={() => onChangeQuery('')}
            >
              <Icon name="close" size={20} className="text-muted-foreground" />
            </Pressable>
          ) : null}
        </View>
      </Animated.View>

      <View className="absolute right-0 top-1/2 -translate-y-1/2">
        <Animated.View style={progress}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel search"
            hitSlop={8}
            onPress={onCancel}
            className="rounded-full border border-border p-3"
          >
            <Icon name="close" size={24} className="text-primary" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
