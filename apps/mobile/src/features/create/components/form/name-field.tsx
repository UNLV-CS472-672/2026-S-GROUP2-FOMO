import type { CreateFormValues } from '@/features/create/types';
import { useAppTheme } from '@/lib/use-app-theme';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

type NameFieldProps = {
  control: Control<CreateFormValues>;
  formActive: boolean;
};

export function NameField({ control, formActive }: NameFieldProps) {
  const { field, fieldState } = useController({
    control,
    name: 'event.name',
    disabled: !formActive,
    rules: { required: 'Event name is required.' },
  });

  const theme = useAppTheme();
  const hasError = !!fieldState.error;

  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">NAME</Text>
      <View
        className={`rounded-2xl border bg-surface px-4 py-3.5 shadow-md ${hasError ? 'border-destructive' : 'border-muted'}`}
      >
        <TextInput
          placeholder="What's the event called?"
          placeholderTextColor={theme.mutedText}
          className="text-[15px] text-foreground"
          value={field.value}
          onChangeText={field.onChange}
          editable={!field.disabled}
          returnKeyType="done"
        />
      </View>
      {hasError ? (
        <Text className="text-[12px] text-destructive">{fieldState.error?.message}</Text>
      ) : null}
    </View>
  );
}
