import { Button, ButtonText } from '@/components/ui/button';
import { Avatar } from '@/features/posts/components/avatar';
import { useAppTheme } from '@/lib/use-app-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { AuthInput } from '../input';

type UsernameStepProps = {
  emailAddress?: string | null;
  username: string;
  usernameError?: string;
  isSubmitting?: boolean;
  avatarUri?: string | null;
  onChangeUsername: (value: string) => void;
  onSubmit: () => void;
};

export function UsernameStep({
  emailAddress,
  username,
  usernameError,
  isSubmitting = false,
  avatarUri,
  onChangeUsername,
  onSubmit,
}: UsernameStepProps) {
  const theme = useAppTheme();
  const router = useRouter();

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

      <View className="mt-2 items-center">
        <TouchableOpacity
          onPress={() => router.push('./gallery-picker')}
          accessibilityLabel="Choose profile photo"
          accessibilityRole="button"
        >
          <Avatar name={username} size={88} source={avatarUri ? { uri: avatarUri } : undefined} />
          <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-primary">
            <MaterialIcons name="edit" size={14} color={theme.tintForeground} />
          </View>
        </TouchableOpacity>
        <Text className="mt-2 text-xs text-muted-foreground">
          {avatarUri ? 'Tap to change photo' : 'Add a profile photo (optional)'}
        </Text>
      </View>

      <View className="mt-4">
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
