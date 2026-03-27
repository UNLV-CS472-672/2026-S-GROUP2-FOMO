import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

type AuthInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthInput({ label, error, className, ...props }: AuthInputProps) {
  return (
    <View>
      <Text className="text-sm font-semibold text-app-text">{label}</Text>
      <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
        <TextInput
          placeholderTextColor="#9CA3AF"
          className={`py-3 text-base text-app-text ${className ?? ''}`.trim()}
          {...props}
        />
      </View>
      {error ? <Text className="mt-1 text-xs text-red-600">{error}</Text> : null}
    </View>
  );
}
