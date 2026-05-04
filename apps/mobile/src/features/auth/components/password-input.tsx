import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { Pressable, Text, TextInput, View } from 'react-native';

type AuthPasswordInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthPasswordInput({ label, error, className, ...props }: AuthPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const theme = useAppTheme();

  return (
    <View>
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <View className="mt-2 flex-row items-center rounded-xl border border-muted-foreground/30 bg-background px-4 h-12">
        <TextInput
          placeholderTextColor={theme.mutedText}
          secureTextEntry={!showPassword}
          style={{ textAlignVertical: 'center' }}
          className={`flex-1 py-3 text-base text-foreground ${className ?? ''}`.trim()}
          {...props}
        />
        <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={8}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.mutedText} />
        </Pressable>
      </View>
      {error ? <Text className="mt-1 text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
