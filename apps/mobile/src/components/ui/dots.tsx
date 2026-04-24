import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

type DotProps = {
  index: number;
  scrollX: SharedValue<number>;
  slideWidth: number;
  activeColorClassName?: string;
  inactiveOpacity?: number;
};

function Dot({
  index,
  scrollX,
  slideWidth,
  activeColorClassName = 'bg-primary',
  inactiveOpacity = 0.3,
}: DotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollX.value,
      [(index - 1) * slideWidth, index * slideWidth, (index + 1) * slideWidth],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      width: interpolate(progress, [0, 1], [6, 18]),
      opacity: interpolate(progress, [0, 1], [inactiveOpacity, 1]),
    };
  });

  return (
    <Animated.View
      className={`rounded-full ${activeColorClassName}`}
      style={[{ height: 6 }, animatedStyle]}
    />
  );
}

type DotsProps = {
  count: number;
  scrollX: SharedValue<number>;
  slideWidth: number;
  activeColorClassName?: string;
  inactiveOpacity?: number;
  className?: string;
};

export function Dots({
  count,
  scrollX,
  slideWidth,
  activeColorClassName,
  inactiveOpacity,
  className = 'flex-row justify-center gap-1.5 py-2',
}: DotsProps) {
  if (count <= 1) return null;

  return (
    <View className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <Dot
          key={index}
          index={index}
          scrollX={scrollX}
          slideWidth={slideWidth}
          activeColorClassName={activeColorClassName}
          inactiveOpacity={inactiveOpacity}
        />
      ))}
    </View>
  );
}
