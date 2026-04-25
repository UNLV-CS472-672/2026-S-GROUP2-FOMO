import type { CreateFormValues, CreateMode } from '@/features/create/types';
import { useAppTheme } from '@/lib/use-app-theme';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

type DescriptionFieldProps = {
  control: Control<CreateFormValues>;
  mode: CreateMode;
};

export function DescriptionField({ control, mode }: DescriptionFieldProps) {
  const isEventMode = mode === 'event';
  const { field, fieldState } = useController({
    control,
    name: isEventMode ? 'event.description' : 'post.description',
    rules: {
      validate: (value, formValues) => {
        if (!isEventMode && !formValues.post.media.uri && !value.trim()) {
          return 'Add a caption or attach a photo/video.';
        }
        return true;
      },
    },
  });

  const theme = useAppTheme();
  const hasError = !!fieldState.error;

  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">
        {isEventMode ? 'DETAILS' : 'CAPTION'}
      </Text>
      <View
        className={`h-32 rounded-2xl border bg-surface px-4 py-3.5 shadow-md ${hasError ? 'border-destructive' : 'border-muted'}`}
      >
        <TextInput
          placeholder={isEventMode ? 'What should people know?' : 'What do you want to share?'}
          placeholderTextColor={theme.mutedText}
          multiline
          textAlignVertical="top"
          className="flex-1 text-[15px] text-foreground"
          value={field.value}
          onChangeText={field.onChange}
        />
      </View>
      {hasError ? (
        <Text className="text-[12px] text-destructive">{fieldState.error?.message}</Text>
      ) : null}
    </View>
  );
}
