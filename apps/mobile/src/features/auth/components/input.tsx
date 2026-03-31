import { useAppTheme } from '@/lib/use-app-theme';
import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

type AuthInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthInput({ label, error, className, ...props }: AuthInputProps) {
  const theme = useAppTheme();

  return (
    <View>
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <View className="mt-2 rounded-xl border border-muted-foreground/30 bg-background px-4">
        <TextInput
          placeholderTextColor={theme.mutedText}
          className={`py-3 text-base text-foreground ${className ?? ''}`.trim()}
          {...props}
        />
      </View>
      {error ? <Text className="mt-1 text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
