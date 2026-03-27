import { Button, ButtonText } from '@/components/ui/button';
import { AuthPasswordInput } from '@/features/auth/components/password-input';

type PasswordStepProps = {
  label: string;
  value: string;
  placeholder: string;
  submitLabel: string;
  submitLoadingLabel: string;
  error?: string;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function PasswordStep({
  label,
  value,
  placeholder,
  submitLabel,
  submitLoadingLabel,
  error,
  isSubmitting = false,
  isDisabled = false,
  onChangeText,
  onSubmit,
}: PasswordStepProps) {
  return (
    <>
      <AuthPasswordInput
        label={label}
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        error={error}
      />

      <Button onPress={onSubmit} disabled={!value || isDisabled}>
        <ButtonText>{isSubmitting ? submitLoadingLabel : submitLabel}</ButtonText>
      </Button>
    </>
  );
}
