import { Button, ButtonText } from '@/components/ui/button';
import { api } from '@fomo/backend/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 24;
const DESCRIPTION_MAX_LENGTH = 280;

export default function EditProfileScreen() {
  const router = useRouter();
  const profile = useQuery(api.users.getCurrentProfileMinimal, {});
  const updateCurrentProfile = useMutation(api.users.updateCurrentProfile);

  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setUsername(profile.username);
    setDescription(profile.bio);
  }, [profile]);

  const normalizedUsername = useMemo(() => username.trim(), [username]);
  const normalizedDescription = useMemo(() => description.trim(), [description]);

  const isFormValid =
    normalizedUsername.length >= USERNAME_MIN_LENGTH &&
    normalizedUsername.length <= USERNAME_MAX_LENGTH &&
    /^[a-zA-Z0-9_.-]+$/.test(normalizedUsername) &&
    normalizedDescription.length <= DESCRIPTION_MAX_LENGTH;

  const hasChanges =
    profile !== undefined &&
    profile !== null &&
    (normalizedUsername !== profile.username || normalizedDescription !== profile.bio);

  async function handleSave() {
    if (!profile || isSaving || !isFormValid || !hasChanges) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateCurrentProfile({
        username: normalizedUsername,
        bio: normalizedDescription,
      });
      router.back();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  }

  if (profile === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator />
        <Text className="mt-3 text-sm text-muted-foreground">Loading profile...</Text>
      </View>
    );
  }

  if (profile === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base text-foreground">Unable to load your profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="grow p-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Text className="text-sm font-medium text-foreground">Username</Text>
        <TextInput
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            setErrorMessage(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={USERNAME_MAX_LENGTH}
          className="mt-2 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
          placeholder="your_username"
          placeholderTextColor="#8A8A8A"
          accessibilityLabel="Username"
        />
        <Text className="mt-1 text-xs text-muted-foreground">
          {normalizedUsername.length}/{USERNAME_MAX_LENGTH}
        </Text>
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground">Description</Text>
        <TextInput
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            setErrorMessage(null);
          }}
          multiline
          textAlignVertical="top"
          maxLength={DESCRIPTION_MAX_LENGTH}
          className="mt-2 min-h-[120px] rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
          placeholder="Tell people a bit about yourself"
          placeholderTextColor="#8A8A8A"
          accessibilityLabel="Description"
        />
        <Text className="mt-1 text-xs text-muted-foreground">
          {normalizedDescription.length}/{DESCRIPTION_MAX_LENGTH}
        </Text>
      </View>

      {!isFormValid ? (
        <Text className="text-sm text-destructive">
          Username must be 3-24 chars and only use letters, numbers, dot, underscore, or hyphen.
        </Text>
      ) : null}

      {errorMessage ? <Text className="text-sm text-destructive">{errorMessage}</Text> : null}

      <View className="mt-2 gap-3">
        <Button
          onPress={() => void handleSave()}
          disabled={!isFormValid || !hasChanges || isSaving}
          accessibilityLabel="Save profile changes"
        >
          <ButtonText>{isSaving ? 'Saving...' : 'Save changes'}</ButtonText>
        </Button>
        <Button variant="ghost" onPress={() => router.back()} disabled={isSaving}>
          <ButtonText variant="ghost">Cancel</ButtonText>
        </Button>
      </View>
    </ScrollView>
  );
}
