import type { ForwardedRef, ReactElement, ReactNode, RefAttributes } from 'react';
import { forwardRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

type Tab<Key extends string> = {
  key: Key;
  onPress: () => void;
  render: (active: boolean) => ReactNode;
  disabled?: boolean;
};

type BaseProps<Key extends string> = {
  tabs: readonly [Tab<Key>, Tab<Key>];
  activeKey: Key;
  progress: SharedValue<number>;
  containerClassName: string;
  containerStyle?: StyleProp<ViewStyle>;
  indicatorClassName: string;
  indicatorInset: number;
  tabClassName: string;
  accessibilityRole?: 'tablist';
};

type EqualWidthProps<Key extends string> = BaseProps<Key> & {
  variant: 'equal';
};

type MeasuredWidthProps<Key extends string> = BaseProps<Key> & {
  variant: 'measured';
};

export type AnimatedTabsProps<Key extends string> = EqualWidthProps<Key> | MeasuredWidthProps<Key>;

function AnimatedTabsInner<Key extends string>(
  {
    variant,
    tabs,
    activeKey,
    progress,
    containerClassName,
    containerStyle,
    indicatorClassName,
    indicatorInset,
    tabClassName,
    accessibilityRole = 'tablist',
  }: AnimatedTabsProps<Key>,
  ref: ForwardedRef<View>
): ReactElement {
  const [containerWidth, setContainerWidth] = useState(0);

  const x0 = useSharedValue(0);
  const w0 = useSharedValue(0);
  const x1 = useSharedValue(0);
  const w1 = useSharedValue(0);

  const indicatorStyle = useAnimatedStyle(() => {
    if (variant === 'measured') {
      const width = w0.value + (w1.value - w0.value) * progress.value;
      return {
        width,
        transform: [{ translateX: x0.value + (x1.value - x0.value) * progress.value }],
        opacity: w0.value > 0 ? 1 : 0,
      };
    }

    const segmentWidth =
      containerWidth > 0 ? (containerWidth - indicatorInset * 2) / tabs.length : 0;

    return {
      width: segmentWidth,
      transform: [{ translateX: segmentWidth * progress.value }],
      opacity: segmentWidth > 0 ? 1 : 0,
    };
  }, [containerWidth, indicatorInset, tabs.length, variant]);

  return (
    <View
      ref={ref}
      accessibilityRole={accessibilityRole}
      className={containerClassName}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      style={containerStyle}
    >
      <Animated.View
        pointerEvents="none"
        className={indicatorClassName}
        style={[
          {
            left: indicatorInset,
          },
          indicatorStyle,
        ]}
      />
      {tabs.map((tab, idx) => {
        const active = tab.key === activeKey;
        const disabled = tab.disabled ?? false;

        return (
          <Pressable
            key={tab.key}
            className={tabClassName}
            onPress={tab.onPress}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled }}
            onLayout={
              variant === 'measured'
                ? (e) => {
                    if (idx === 0) {
                      x0.value = e.nativeEvent.layout.x;
                      w0.value = e.nativeEvent.layout.width;
                    } else {
                      x1.value = e.nativeEvent.layout.x;
                      w1.value = e.nativeEvent.layout.width;
                    }
                  }
                : undefined
            }
          >
            {tab.render(active)}
          </Pressable>
        );
      })}
    </View>
  );
}

export const AnimatedTabs = forwardRef(AnimatedTabsInner) as <Key extends string>(
  props: AnimatedTabsProps<Key> & RefAttributes<View>
) => ReactElement;
