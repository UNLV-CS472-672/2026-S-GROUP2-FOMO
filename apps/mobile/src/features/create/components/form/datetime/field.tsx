import { Icon } from '@/components/icon';
import type { CreateFormValues } from '@/features/create/types';
import { useState } from 'react';
import { useController, type Control } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { DateTimePickerSheet, formatDateTime } from './sheet';

type DatetimeFieldProps = {
  control: Control<CreateFormValues>;
  formActive: boolean;
};

export function DatetimeField({ control, formActive }: DatetimeFieldProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const { field: startField, fieldState: startState } = useController({
    control,
    name: 'event.startDate',
    disabled: !formActive,
    rules: { required: 'Start time is required.' },
  });

  const { field: endField, fieldState: endState } = useController({
    control,
    name: 'event.endDate',
    disabled: !formActive,
    rules: {
      required: 'End time is required.',
      validate: (v) => (v as number) > (startField.value as number) || 'End must be after start.',
    },
  });

  const error = startState.error?.message ?? endState.error?.message;

  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">
        DATE & TIME
      </Text>

      <Pressable
        disabled={startField.disabled}
        onPress={() => setSheetOpen(true)}
        className="rounded-2xl border border-muted bg-surface px-4 py-3.5 shadow-md"
      >
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text className="text-[15px] font-medium text-foreground" numberOfLines={1}>
              {formatDateTime(startField.value as number)} —
            </Text>
            <Text className="text-[15px] font-medium text-foreground" numberOfLines={1}>
              {formatDateTime(endField.value as number)}
            </Text>
          </View>
          <Icon name="keyboard-arrow-down" size={20} className="text-muted-foreground" />
        </View>
      </Pressable>

      {error ? (
        <Text className="text-[12px] text-destructive" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <DateTimePickerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        startTs={startField.value as number}
        endTs={endField.value as number}
        onStartChange={startField.onChange}
        onEndChange={endField.onChange}
      />
    </View>
  );
}
