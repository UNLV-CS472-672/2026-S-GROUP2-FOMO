import { useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

type VerificationCodeInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmitEditing?: () => void;
  isSubmitting?: boolean;
};

export function VerificationCodeInput({
  value,
  onChangeText,
  onSubmitEditing,
  isSubmitting = false,
}: VerificationCodeInputProps) {
  const inputRef = useRef<TextInput | null>(null);
  const lastSubmittedValueRef = useRef<string | null>(null);
  const digits = useMemo(
    () => Array.from({ length: 6 }, (_, index) => value[index] ?? ''),
    [value]
  );

  useEffect(() => {
    if (value.length !== 6) {
      lastSubmittedValueRef.current = null;
      return;
    }

    if (isSubmitting || !onSubmitEditing || lastSubmittedValueRef.current === value) {
      return;
    }

    lastSubmittedValueRef.current = value;
    inputRef.current?.blur();
    onSubmitEditing();
  }, [isSubmitting, onSubmitEditing, value]);

  return (
    <Pressable className="mt-2" onPress={() => inputRef.current?.focus()}>
      <View className="flex-row justify-between gap-2">
        {digits.map((digit, index) => {
          const isFilled = digit.length > 0;
          const isActive = value.length === index;

          return (
            <View
              key={index}
              className={`h-14 flex-1 items-center justify-center rounded-xl border ${
                isActive
                  ? 'border-app-tint bg-app-tint/5'
                  : isFilled
                    ? 'border-app-text/40 bg-app-background'
                    : 'border-app-icon/30 bg-app-background'
              }`}
            >
              <Text className="text-lg font-semibold text-app-text">{digit}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        onChangeText={(nextValue) => onChangeText(nextValue.replace(/\D/g, '').slice(0, 6))}
        className="absolute h-0 w-0 opacity-0"
        maxLength={6}
        returnKeyType="done"
        caretHidden
      />
    </Pressable>
  );
}
