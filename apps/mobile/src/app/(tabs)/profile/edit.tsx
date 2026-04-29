import { DrawerModal } from '@/components/ui/drawer';
import { Avatar } from '@/features/posts/components/avatar';
import { useAppTheme } from '@/lib/use-app-theme';
import { useUser } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  const updateCurrentProfile = useMutation(api.users.updateCurrentProfile);
  const updateAvatarUrl = useMutation(api.users.updateAvatarUrl);

  const [username, setUsername] = useState(clerkUser?.username ?? '');
  const [description, setDescription] = useState(
    (clerkUser?.unsafeMetadata?.bio as string | undefined) ?? ''
  );
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPickerDrawerOpen, setIsPickerDrawerOpen] = useState(false);

  async function openGallery() {
    setIsPickerDrawerOpen(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPendingAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!clerkUser) return;
    setUsernameError('');
    setErrorMessage('');
    setIsSaving(true);

    try {
      // Avatar update: Clerk first, then DB
      if (pendingAvatarUri) {
        const response = await fetch(pendingAvatarUri);
        const blob = await response.blob();
        await clerkUser.setProfileImage({ file: blob });
        await clerkUser.reload();
        const avatarUrl = clerkUser.imageUrl;
        if (avatarUrl) {
          await updateAvatarUrl({ avatarUrl });
        }
        setPendingAvatarUri(null);
      }

      // Profile text update
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
        {/* Avatar picker */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={() => setIsPickerDrawerOpen(true)}
            accessibilityLabel="Change profile picture"
            accessibilityRole="button"
          >
            <Avatar name={clerkUser?.username ?? ''} size={96} source={avatarSource} />
            <View style={styles.avatarBadge}>
              <MaterialIcons
                name="edit"
                size={14}
                color="#fff"
                style={{ transform: [{ scaleX: -1 }] }}
              />
            </View>
          </TouchableOpacity>
          <Text className="mt-2 text-sm text-muted-foreground">Tap to change photo</Text>
        </View>

        {/* Username */}
        <View className="gap-1">
          <Text className="text-sm font-medium text-foreground">Username</Text>
          <TextInput
            className="rounded-xl bg-card px-4 py-3 text-base text-foreground"
            value={username}
            onChangeText={(t) => {
              setUsername(t);
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

        {/* Bio */}
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

        {/* Save button */}
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

      <DrawerModal
        open={isPickerDrawerOpen}
        onClose={() => setIsPickerDrawerOpen(false)}
        snapPoints={['30%']}
        enablePanDownToClose
      >
        <BottomSheetView style={styles.drawerContent}>
          <Text className="mb-4 text-center text-base font-semibold text-foreground">
            Change Profile Photo
          </Text>
          <TouchableOpacity
            className="rounded-xl bg-card px-4 py-4"
            onPress={() => void openGallery()}
            accessibilityLabel="Choose from library"
            accessibilityRole="button"
          >
            <Text className="text-base text-foreground">Choose from Library</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </DrawerModal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerContent: {
    padding: 24,
  },
});
