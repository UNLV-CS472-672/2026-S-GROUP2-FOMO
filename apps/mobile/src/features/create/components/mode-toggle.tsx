import { Icon } from '@/components/icon';
import type { CreateMode } from '@/features/create/types';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type CreateModeToggleProps = {
  selectedMode: CreateMode;
  modeProgress: SharedValue<number>;
  topInset: number;
  onSelectMode: (mode: CreateMode) => void;
};

export function CreateModeToggle({
  selectedMode,
  modeProgress,
  topInset,
  onSelectMode,
}: CreateModeToggleProps) {
  const [modeToggleWidth, setModeToggleWidth] = useState(0);
  const isEventMode = selectedMode === 'event';

  const modeIndicatorStyle = useAnimatedStyle(() => {
    const horizontalInset = 6;
    const segmentWidth = modeToggleWidth > 0 ? (modeToggleWidth - horizontalInset * 2) / 2 : 0;

    return {
      width: segmentWidth,
      transform: [{ translateX: segmentWidth * modeProgress.value }],
      opacity: segmentWidth > 0 ? 1 : 0,
    };
  }, [modeToggleWidth]);

  return (
    <View
      className="mx-16 flex-row rounded-full border border-border bg-surface p-1.5"
      onLayout={(event) => setModeToggleWidth(event.nativeEvent.layout.width)}
      style={{
        marginTop: topInset + 8,
        marginBottom: 10,
      }}
    >
      <Animated.View
        pointerEvents="none"
        className="absolute bottom-1.5 left-1.5 top-1.5 rounded-full bg-primary"
        style={modeIndicatorStyle}
      />
      <Pressable
        className="flex-1 flex-row items-center justify-center gap-2 rounded-full px-0 py-2"
        onPress={() => onSelectMode('post')}
        accessibilityRole="tab"
        accessibilityState={{ selected: !isEventMode }}
      >
        <Icon
          name="article"
          size={18}
          className={!isEventMode ? 'text-primary-foreground' : 'text-muted-foreground'}
        />
        <Text
          className={
            !isEventMode
              ? 'font-semibold text-primary-foreground'
              : 'font-semibold text-muted-foreground'
          }
        >
          Post
        </Text>
      </Pressable>

      <Pressable
        className="flex-1 flex-row items-center justify-center gap-2 rounded-full px-0 py-2"
        onPress={() => onSelectMode('event')}
        accessibilityRole="tab"
        accessibilityState={{ selected: isEventMode }}
      >
        <Icon
          name="event"
          size={18}
          className={isEventMode ? 'text-primary-foreground' : 'text-muted-foreground'}
        />
        <Text
          className={
            isEventMode
              ? 'font-semibold text-primary-foreground'
              : 'font-semibold text-muted-foreground'
          }
        >
          Event
        </Text>
      </Pressable>
    </View>
  );
}
