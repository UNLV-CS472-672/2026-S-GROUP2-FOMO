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

  return (
    <View>
      <Text className="text-sm font-semibold text-app-text">{label}</Text>
      <View className="mt-2 flex-row items-center rounded-xl border border-app-icon/30 bg-app-background px-4">
        <TextInput
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPassword}
          className={`flex-1 py-3 text-base text-app-text ${className ?? ''}`.trim()}
          {...props}
        />
        <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={8}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
        </Pressable>
      </View>
      {error ? <Text className="mt-1 text-xs text-red-600">{error}</Text> : null}
    </View>
  );
}
