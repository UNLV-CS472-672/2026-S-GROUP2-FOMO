import { Button, ButtonText } from '@/components/ui/button';
import { useAppTheme } from '@/lib/use-app-theme';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { VerificationCodeInput } from './code-input';

type VerificationStepProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  resendAvailableAt: number | null;
  isResending?: boolean;
  isSubmitting?: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  error?: string;
};

export function VerificationStep({
  value,
  onChangeText,
  onSubmit,
  onResend,
  resendAvailableAt,
  isResending = false,
  isSubmitting = false,
  submitLabel,
  submitLoadingLabel,
  error,
}: VerificationStepProps) {
  const theme = useAppTheme();
  const [now, setNow] = useState(Date.now());
  const resendCountdown = resendAvailableAt
    ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
    : 0;
  const canResend = resendCountdown === 0 && !isResending;
  const handleSubmit = () => {
    if (isSubmitting) return;
    onSubmit();
  };

  useEffect(() => {
    if (!resendAvailableAt || resendCountdown === 0) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [resendAvailableAt, resendCountdown]);

  return (
    <View className="gap-4">
      <View>
        <VerificationCodeInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          isSubmitting={isSubmitting}
        />
        {error ? <Text className="mt-1.5 text-xs text-destructive">{error}</Text> : null}
      </View>

      <View className="flex-row items-center justify-between">
        <Pressable onPress={onResend} disabled={!canResend} hitSlop={8}>
          <Text
            className={
              !canResend ? 'text-sm text-muted-foreground' : 'text-sm font-semibold text-primary'
            }
          >
            {isResending
              ? 'Resending code...'
              : canResend
                ? 'Resend code'
                : `Resend code (${resendCountdown}s)`}
          </Text>
        </Pressable>

        {isResending ? <ActivityIndicator size="small" color={theme.mutedText} /> : null}
      </View>

      <Button onPress={handleSubmit} disabled={!value || isSubmitting}>
        <ButtonText>{isSubmitting ? submitLoadingLabel : submitLabel}</ButtonText>
      </Button>
    </View>
  );
}
