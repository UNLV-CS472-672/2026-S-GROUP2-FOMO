import { AnimatedTabs } from '@/components/navigation/animated-tabs';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type FeedMode = 'foryou' | 'popular';

type FeedTabsProps = {
  value: FeedMode;
  onChange: (mode: FeedMode) => void;
};

export function FeedTabs({ value, onChange }: FeedTabsProps) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value === 'foryou' ? 0 : 1, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, [value, progress]);

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center"
      style={{ top: insets.top + 8 }}
    >
      <AnimatedTabs
        variant="measured"
        tabs={[
          {
            key: 'foryou',
            onPress: () => onChange('foryou'),
            render: (active) => (
              <Text
                className={`text-sm font-semibold ${
                  active ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                For You
              </Text>
            ),
          },
          {
            key: 'popular',
            onPress: () => onChange('popular'),
            render: (active) => (
              <Text
                className={`text-sm font-semibold ${
                  active ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                Popular
              </Text>
            ),
          },
        ]}
        activeKey={value}
        progress={progress}
        containerClassName="flex-row rounded-full bg-card/40 p-1"
        indicatorClassName="absolute bottom-1 top-1 rounded-full bg-primary"
        indicatorInset={4}
        tabClassName="rounded-full px-4 py-1.5"
      />
    </View>
  );
}
