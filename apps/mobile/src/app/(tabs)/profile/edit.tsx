import { Avatar } from '@/features/posts/components/avatar';
import { buildClerkImageFile } from '@/features/profile/clerk-image';
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
    avatarFileName?: string | string[];
    avatarNonce?: string | string[];
  }>();

  const updateBio = useMutation(api.users.updateBio);

  const [description, setDescription] = useState(
    (clerkUser?.unsafeMetadata?.bio as string | undefined) ?? ''
  );
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [pendingAvatarFileName, setPendingAvatarFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const avatarUriParam = Array.isArray(params.avatarUri) ? params.avatarUri[0] : params.avatarUri;
  const avatarFileNameParam = Array.isArray(params.avatarFileName)
    ? params.avatarFileName[0]
    : params.avatarFileName;
  const avatarNonceParam = Array.isArray(params.avatarNonce)
    ? params.avatarNonce[0]
    : params.avatarNonce;

  useEffect(() => {
    if (!avatarUriParam) {
      return;
    }

    setPendingAvatarUri(avatarUriParam);
    setPendingAvatarFileName(avatarFileNameParam ?? null);
    setErrorMessage('');
  }, [avatarFileNameParam, avatarNonceParam, avatarUriParam]);

  function openGallery() {
    router.push('./gallery-picker');
  }

  async function handleSave() {
    if (!clerkUser) return;
    setErrorMessage('');
    setIsSaving(true);

    try {
      if (pendingAvatarUri) {
        const file = await buildClerkImageFile({
          uri: pendingAvatarUri,
          fileName: pendingAvatarFileName,
        });

        console.log('uploading file', file);
        await clerkUser.setProfileImage({ file });
        await clerkUser.reload();
        setPendingAvatarUri(null);
        setPendingAvatarFileName(null);
      }

      const trimmedBio = description.trim();
      const currentBio = (clerkUser.unsafeMetadata?.bio as string | undefined) ?? '';

      if (trimmedBio !== currentBio) {
        await updateBio({ bio: trimmedBio });
      }

      router.replace('/profile');
    } catch (err) {
      if (__DEV__) console.error('error saving profile', err);
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
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
