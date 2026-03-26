import { Button, ButtonText } from '@/components/ui/button';
import { Text, TextInput, View } from 'react-native';

type UsernameSetupCardProps = {
  emailAddress?: string | null;
  username: string;
  globalError?: string;
  usernameError?: string;
  isSubmitting?: boolean;
  onChangeUsername: (value: string) => void;
  onSubmit: () => void;
};

export function UsernameSetupCard({
  emailAddress,
  username,
  globalError,
  usernameError,
  isSubmitting = false,
  onChangeUsername,
  onSubmit,
}: UsernameSetupCardProps) {
  return (
    <View className="w-full">
      <Text className="text-3xl font-bold text-app-text">Choose a username</Text>
      <Text className="mt-2 text-base text-app-icon">
        One last step before we finish creating your account.
      </Text>

      {emailAddress ? (
        <View className="mt-4 rounded-xl border border-app-icon/15 bg-app-background px-4 py-3">
          <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-app-icon/80">
            Account email
          </Text>
          <Text className="mt-1 text-base font-medium text-app-text">{emailAddress}</Text>
        </View>
      ) : null}

      {globalError ? (
        <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
          <Text className="text-sm font-medium text-red-800">{globalError}</Text>
        </View>
      ) : null}

      <View className="mt-8">
        <Text className="text-sm font-semibold text-app-text">Username</Text>
        <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
          <TextInput
            autoCapitalize="none"
            value={username}
            placeholder="cooluser123"
            placeholderTextColor="#9CA3AF"
            onChangeText={onChangeUsername}
            className="py-3 text-base text-app-text"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </View>
        {usernameError ? <Text className="mt-1 text-xs text-red-600">{usernameError}</Text> : null}
      </View>

      <View className="mt-6">
        <Button onPress={onSubmit} disabled={!username.trim() || isSubmitting}>
          <ButtonText>{isSubmitting ? 'Finishing account setup...' : 'Continue'}</ButtonText>
        </Button>
      </View>
    </View>
  );
}
