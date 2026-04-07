import { Icon } from '@/components/icon';
import { SEARCH_DRAWER_STATE } from '@/features/map/components/search/constants';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { type RefObject } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

interface SearchHeaderProps {
  query: string;
  isListening: boolean;
  placeholderTextColor: string;
  animatedIndex?: SharedValue<number>;
  inputRef?: RefObject<any | null>;
  onChangeQuery: (value: string) => void;
  onCancel: () => void;
  onExpand: () => void;
  onVoiceSearch: () => void;
}

export function SearchHeader({
  query,
  isListening,
  placeholderTextColor,
  animatedIndex,
  inputRef,
  onChangeQuery,
  onCancel,
  onExpand,
  onVoiceSearch,
}: SearchHeaderProps) {
  const expandedStateStart = SEARCH_DRAWER_STATE.expanded - 0.4;
  const fallbackAnimatedIndex = useSharedValue(0);
  const listeningPulse = useSharedValue(0);
  const resolvedAnimatedIndex = animatedIndex ?? fallbackAnimatedIndex;
  const listeningProgress = useDerivedValue(() => {
    if (isListening) {
      listeningPulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
      return 1;
    }

    listeningPulse.value = withTiming(0, { duration: 180 });
    return 0;
  }, [isListening]);

  const progress = useAnimatedStyle(() => {
    const cancelProgress = interpolate(
      resolvedAnimatedIndex.value,
      [expandedStateStart, SEARCH_DRAWER_STATE.expanded],
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
      [expandedStateStart, SEARCH_DRAWER_STATE.expanded],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      marginRight: interpolate(cancelProgress, [0, 1], [0, 56], Extrapolation.CLAMP),
    };
  });

  const micBadgeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(listeningPulse.value, [0, 1], [0.45, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(listeningPulse.value, [0, 1], [1, 1.18], Extrapolation.CLAMP) },
    ],
  }));

  const listeningRowAnimatedStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(listeningProgress.value, [0, 1], [0, 28], Extrapolation.CLAMP),
    opacity: listeningProgress.value,
    marginTop: interpolate(listeningProgress.value, [0, 1], [0, 10], Extrapolation.CLAMP),
  }));

  return (
    <View className="relative z-10 mx-4 mt-2 mb-8">
      <Animated.View style={inputAnimatedStyle}>
        <View className="rounded-2xl border border-border bg-background px-4 py-3 pb-4">
          <View className="flex-row items-center gap-3">
            <Icon name="search" size={24} className="text-muted-foreground" />
            <BottomSheetTextInput
              ref={inputRef}
              value={query}
              onChangeText={(value) => {
                onExpand();
                onChangeQuery(value);
              }}
              onPressIn={onExpand}
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
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isListening ? 'Stop voice search' : 'Voice search'}
                className="items-center justify-center rounded-full"
                hitSlop={8}
                onPress={onVoiceSearch}
              >
                <Animated.View style={micBadgeAnimatedStyle}>
                  <Icon
                    name="mic"
                    size={20}
                    className={isListening ? 'text-primary' : 'text-muted-foreground'}
                  />
                </Animated.View>
              </Pressable>
            )}
          </View>
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
