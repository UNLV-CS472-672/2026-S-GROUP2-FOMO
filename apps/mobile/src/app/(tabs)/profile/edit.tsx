import { Button, ButtonText } from '@/components/ui/button';
import { DrawerModal } from '@/components/ui/drawer';
import { Avatar } from '@/features/posts/components/avatar';
import { useUser } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 24;
const DESCRIPTION_MAX_LENGTH = 280;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const profile = useQuery(api.users.getCurrentProfileMinimal, {});
  const updateCurrentProfile = useMutation(api.users.updateCurrentProfile);
  const updateAvatarUrl = useMutation(api.users.updateAvatarUrl);

  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [isPickerDrawerOpen, setIsPickerDrawerOpen] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
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
    (normalizedUsername !== profile.username ||
      normalizedDescription !== profile.bio ||
      pendingAvatarUri !== null);

  async function openGallery() {
    setIsPickerDrawerOpen(false);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Gallery access is required to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setPendingAvatarUri(asset.uri);
      setErrorMessage(null);
    }
  }

  async function handleSave() {
    if (!profile || isSaving || !isFormValid || !hasChanges) return;

    setIsSaving(true);
    setUsernameError(null);
    setErrorMessage(null);

    try {
      if (pendingAvatarUri) {
        const response = await fetch(pendingAvatarUri);
        const blob = await response.blob();
        const image = await clerkUser?.setProfileImage({ file: blob });
        const avatarUrl = image?.publicUrl;

        if (!avatarUrl) {
          throw new Error('Could not resolve Clerk avatar URL.');
        }

        await updateAvatarUrl({ avatarUrl });
      }

      if (normalizedUsername !== profile.username || normalizedDescription !== profile.bio) {
        await updateCurrentProfile({
          username: normalizedUsername,
          bio: normalizedDescription,
        });
      }

      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update profile.';
      if (message === 'Username is taken') {
        setUsernameError(message);
      } else {
        setErrorMessage(message);
      }
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

  const avatarSource = pendingAvatarUri
    ? { uri: pendingAvatarUri }
    : profile.avatarUrl
      ? { uri: profile.avatarUrl }
      : undefined;

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="grow p-6 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View className="items-center py-2">
          <TouchableOpacity
            onPress={() => setIsPickerDrawerOpen(true)}
            accessibilityLabel="Change profile picture"
            accessibilityRole="button"
          >
            <View>
              <Avatar name={profile.username} size={96} source={avatarSource} />
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-primary">
                <MaterialIcons
                  name="edit"
                  size={14}
                  color="white"
                  style={{ transform: [{ scaleX: -1 }] }}
                />
              </View>
            </View>
          </TouchableOpacity>
          <Text className="mt-2 text-sm text-muted-foreground">Tap to change photo</Text>
        </View>

        {/* Username */}
        <View>
          <Text className="text-sm font-medium text-foreground">Username</Text>
          <TextInput
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              setUsernameError(null);
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
          {usernameError ? (
            <Text className="mt-1 text-sm text-destructive">{usernameError}</Text>
          ) : null}
        </View>

        {/* Description */}
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

      {/* Photo picker drawer */}
      <DrawerModal
        open={isPickerDrawerOpen}
        onClose={() => setIsPickerDrawerOpen(false)}
        snapPoints={['28%']}
        enablePanDownToClose
        backdropAppearsOnIndex={0}
        backdropDisappearsOnIndex={-1}
      >
        <BottomSheetView style={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}>
          <Text className="text-center text-base font-semibold text-foreground">
            Change profile photo
          </Text>
          <Button onPress={() => void openGallery()} accessibilityLabel="Choose from gallery">
            <ButtonText>Choose from gallery</ButtonText>
          </Button>
          <Button
            variant="ghost"
            onPress={() => setIsPickerDrawerOpen(false)}
            accessibilityLabel="Cancel photo change"
          >
            <ButtonText variant="ghost">Cancel</ButtonText>
          </Button>
        </BottomSheetView>
      </DrawerModal>
    </>
  );
}
