import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type FeedMode = 'foryou' | 'popular';

type FeedTabsProps = {
  value: FeedMode;
  onChange: (mode: FeedMode) => void;
};

const TABS: { key: FeedMode; label: string }[] = [
  { key: 'foryou', label: 'For You' },
  { key: 'popular', label: 'Popular' },
];

export function FeedTabs({ value, onChange }: FeedTabsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center"
      style={{ top: insets.top + 8 }}
    >
      <View className="flex-row gap-1 rounded-full bg-card/40 p-1">
        {TABS.map((tab) => (
          <FeedTab
            key={tab.key}
            label={tab.label}
            active={value === tab.key}
            onPress={() => onChange(tab.key)}
          />
        ))}
      </View>
    </View>
  );
}

type FeedTabProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FeedTab({ label, active, onPress }: FeedTabProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={cn(
        'rounded-full px-4 py-1.5',
        active && 'bg-primary',
        !active && pressed && 'bg-accent',
        active && pressed && 'opacity-85'
      )}
    >
      <Text
        className={cn(
          'text-sm font-semibold',
          active ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
