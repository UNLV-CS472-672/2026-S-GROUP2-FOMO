import { Avatar } from '@/features/posts/components/avatar';
import { useAppTheme } from '@/lib/use-app-theme';
import { useUser } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{
    avatarUri?: string | string[];
    avatarNonce?: string | string[];
  }>();

  // TODO :: SHOULD BE REMOVED AFTER CLERK CONVEX WEBHOOK
  const updateCurrentProfile = useMutation(api.users.updateCurrentProfile);
  // TODO :: SHOULD BE REMOVED AFTER CLERK CONVEX WEBHOOK
  const updateAvatarUrl = useMutation(api.users.updateAvatarUrl);

  const [username, setUsername] = useState(clerkUser?.username ?? '');
  const [description, setDescription] = useState(
    (clerkUser?.unsafeMetadata?.bio as string | undefined) ?? ''
  );
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const avatarUriParam = Array.isArray(params.avatarUri) ? params.avatarUri[0] : params.avatarUri;
  const avatarNonceParam = Array.isArray(params.avatarNonce)
    ? params.avatarNonce[0]
    : params.avatarNonce;

  useEffect(() => {
    if (!avatarUriParam) {
      return;
    }

    setPendingAvatarUri(avatarUriParam);
    setErrorMessage('');
  }, [avatarNonceParam, avatarUriParam]);

  function openGallery() {
    router.push('/profile/gallery-picker');
  }

  function buildClerkImageFile(uri: string) {
    const normalizedUri = uri.split('?')[0] ?? uri;
    const name = normalizedUri.split('/').pop() || `avatar-${Date.now()}.jpg`;
    const extension = name.split('.').pop()?.toLowerCase();
    const type =
      extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : extension === 'heic' || extension === 'heif'
            ? 'image/heic'
            : 'image/jpeg';

    return { uri, name, type };
  }

  async function handleSave() {
    if (!clerkUser) return;
    setUsernameError('');
    setErrorMessage('');
    setIsSaving(true);

    try {
      if (pendingAvatarUri) {
        await clerkUser.setProfileImage({
          file: buildClerkImageFile(pendingAvatarUri) as unknown as Parameters<
            typeof clerkUser.setProfileImage
          >[0]['file'],
        });
        await clerkUser.reload();
        if (clerkUser.imageUrl) {
          await updateAvatarUrl({ avatarUrl: clerkUser.imageUrl });
        }
        setPendingAvatarUri(null);
      }

      const trimmedUsername = username.trim();
      const trimmedBio = description.trim();
      const currentUsername = clerkUser.username ?? '';
      const currentBio = (clerkUser.unsafeMetadata?.bio as string | undefined) ?? '';

      if (trimmedUsername !== currentUsername || trimmedBio !== currentBio) {
        await updateCurrentProfile({ username: trimmedUsername, bio: trimmedBio });
      }

      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (msg === 'Username is taken') {
        setUsernameError('Username is already taken');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const avatarSource = pendingAvatarUri
    ? { uri: pendingAvatarUri }
    : clerkUser?.imageUrl
      ? { uri: clerkUser.imageUrl }
      : undefined;

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="p-6 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={openGallery}
            accessibilityLabel="Change profile picture"
            accessibilityRole="button"
          >
            <Avatar name={clerkUser?.username ?? ''} size={96} source={avatarSource} />
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-primary">
              <MaterialIcons name="edit" size={16} color={theme.tintForeground} />
            </View>
          </TouchableOpacity>
          <Text className="mt-2 text-sm text-muted-foreground">Tap to change photo</Text>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-foreground">Username</Text>
          <TextInput
            className="rounded-xl bg-card px-4 py-3 text-base text-foreground"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setUsernameError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Username"
            placeholderTextColor={theme.mutedText}
            accessibilityLabel="Username"
          />
          {usernameError ? <Text className="text-sm text-destructive">{usernameError}</Text> : null}
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-foreground">Bio</Text>
          <TextInput
            className="rounded-xl bg-card px-4 py-3 text-base text-foreground"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Tell people about yourself"
            placeholderTextColor={theme.mutedText}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
            accessibilityLabel="Bio"
          />
        </View>

        {errorMessage ? <Text className="text-sm text-destructive">{errorMessage}</Text> : null}

        <TouchableOpacity
          className="items-center rounded-xl bg-primary py-3"
          onPress={() => void handleSave()}
          disabled={isSaving}
          accessibilityLabel="Save profile"
          accessibilityRole="button"
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-primary-foreground">Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
  },
});
