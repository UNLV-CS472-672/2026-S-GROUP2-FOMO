import { Icon } from '@/components/icon';
import { AnimatedTabs } from '@/components/navigation/animated-tabs';
import type { CreateMode } from '@/features/create/types';
import { Text } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

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
  const isEventMode = selectedMode === 'event';

  return (
    <AnimatedTabs
      variant="equal"
      tabs={[
        {
          key: 'post',
          onPress: () => onSelectMode('post'),
          render: (active) => (
            <>
              <Icon
                name="article"
                size={18}
                className={active ? 'text-primary-foreground' : 'text-muted-foreground'}
              />
              <Text
                className={
                  active
                    ? 'font-semibold text-primary-foreground'
                    : 'font-semibold text-muted-foreground'
                }
              >
                Post
              </Text>
            </>
          ),
        },
        {
          key: 'event',
          onPress: () => onSelectMode('event'),
          render: (active) => (
            <>
              <Icon
                name="event"
                size={18}
                className={active ? 'text-primary-foreground' : 'text-muted-foreground'}
              />
              <Text
                className={
                  active
                    ? 'font-semibold text-primary-foreground'
                    : 'font-semibold text-muted-foreground'
                }
              >
                Event
              </Text>
            </>
          ),
        },
      ]}
      activeKey={isEventMode ? 'event' : 'post'}
      progress={modeProgress}
      containerClassName="mx-16 flex-row rounded-full border border-border bg-surface p-1.5"
      indicatorClassName="absolute bottom-1.5 top-1.5 rounded-full bg-primary"
      indicatorInset={6}
      tabClassName="flex-1 flex-row items-center justify-center gap-2 rounded-full px-0 py-2"
      // Keep layout behavior identical to the original container.
      containerStyle={{
        marginTop: topInset + 8,
        marginBottom: 10,
      }}
    />
  );
}
