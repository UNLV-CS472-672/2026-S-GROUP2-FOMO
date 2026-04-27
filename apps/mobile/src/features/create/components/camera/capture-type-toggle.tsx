import { AnimatedTabs } from '@/components/navigation/animated-tabs';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

type CaptureType = 'photo' | 'video';

type CaptureTypeToggleProps = {
  captureType: CaptureType;
  onChange: (type: CaptureType) => void;
  disabled?: boolean;
};

export function CaptureTypeToggle({ captureType, onChange, disabled }: CaptureTypeToggleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(captureType === 'video' ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [captureType, progress]);

  return (
    <AnimatedTabs
      variant="measured"
      tabs={[
        {
          key: 'photo',
          onPress: () => onChange('photo'),
          disabled,
          render: (active) => (
            <Text
              className={
                active
                  ? 'font-semibold text-primary-foreground'
                  : 'font-semibold text-muted-foreground'
              }
            >
              Photo
            </Text>
          ),
        },
        {
          key: 'video',
          onPress: () => onChange('video'),
          disabled,
          render: (active) => (
            <Text
              className={
                active
                  ? 'font-semibold text-primary-foreground'
                  : 'font-semibold text-muted-foreground'
              }
            >
              Video
            </Text>
          ),
        },
      ]}
      activeKey={captureType}
      progress={progress}
      containerClassName="flex-row self-center rounded-full border border-border bg-surface/50 p-[3px]"
      indicatorClassName="absolute bottom-[3px] top-[3px] rounded-full bg-primary"
      indicatorInset={0}
      tabClassName="rounded-full px-4 py-2"
    />
  );
}
