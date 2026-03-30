import { Button, ButtonText } from '@/components/ui/button';
import { Text, View } from 'react-native';
import { AuthInput } from '../input';

type UsernameStepProps = {
  emailAddress?: string | null;
  username: string;
  usernameError?: string;
  isSubmitting?: boolean;
  onChangeUsername: (value: string) => void;
  onSubmit: () => void;
};

export function UsernameStep({
  emailAddress,
  username,
  usernameError,
  isSubmitting = false,
  onChangeUsername,
  onSubmit,
}: UsernameStepProps) {
  return (
    <>
      {emailAddress ? (
        <View className="rounded-xl border border-muted-foreground/15 bg-background px-4 py-3">
          <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-muted-foreground/80">
            Account email
          </Text>
          <Text className="mt-1 text-base font-medium text-foreground">{emailAddress}</Text>
        </View>
      ) : null}

      <View className="mt-2">
        <AuthInput
          label="Username"
          value={username}
          placeholder="cooluser123"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeUsername}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          error={usernameError}
        />
      </View>

      <View className="mt-6">
        <Button onPress={onSubmit} disabled={!username.trim() || isSubmitting}>
          <ButtonText>{isSubmitting ? 'Finishing account setup...' : 'Continue'}</ButtonText>
        </Button>
      </View>
    </>
  );
}
