import { Button, ButtonText } from '@/components/ui/button';
import { AppleButton } from '@/features/auth/components/apple-button';
import { GoogleButton } from '@/features/auth/components/google-button';
import { AuthInput } from '@/features/auth/components/input';
import { Text, View } from 'react-native';

type IdentifierStepProps = {
  mode?: 'signup' | 'login';
  value: string;
  placeholder: string;
  buttonLabel: string;
  dividerLabel: string;
  isAppleLoading?: boolean;
  isAppleDisabled?: boolean;
  isBusy?: boolean;
  isGoogleLoading?: boolean;
  isGoogleDisabled?: boolean;
  isPrimaryLoading?: boolean;
  error?: string;
  onApplePress?: () => void;
  onChangeText: (value: string) => void;
  onPrimaryPress: () => void;
  onGooglePress: () => void;
};

export function IdentifierStep({
  mode = 'login',
  value,
  placeholder,
  buttonLabel,
  dividerLabel,
  isAppleLoading = false,
  isAppleDisabled = false,
  isBusy = false,
  isGoogleLoading = false,
  isGoogleDisabled = false,
  isPrimaryLoading = false,
  error,
  onApplePress,
  onChangeText,
  onPrimaryPress,
  onGooglePress,
}: IdentifierStepProps) {
  return (
    <>
      {onApplePress ? (
        <AppleButton
          mode={mode}
          onPress={onApplePress}
          loading={isAppleLoading}
          disabled={isAppleDisabled || isBusy}
        />
      ) : null}

      <GoogleButton
        mode={mode}
        onPress={onGooglePress}
        loading={isGoogleLoading}
        disabled={isGoogleDisabled || isBusy}
      />

      <View className="flex-row items-center gap-4">
        <View className="flex-1 border-b border-muted-foreground/20" />
        <Text className="text-sm text-muted-foreground">{dividerLabel}</Text>
        <View className="flex-1 border-b border-muted-foreground/20" />
      </View>

      <AuthInput
        label={mode === 'signup' ? 'Email' : 'Email or username'}
        value={value}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={mode === 'signup' ? 'email-address' : 'default'}
        onChangeText={onChangeText}
        returnKeyType="done"
        onSubmitEditing={onPrimaryPress}
        error={error}
      />

      <Button onPress={onPrimaryPress} disabled={!value.trim() || isBusy || isGoogleDisabled}>
        <ButtonText>{isPrimaryLoading ? 'Sending code...' : buttonLabel}</ButtonText>
      </Button>
    </>
  );
}
