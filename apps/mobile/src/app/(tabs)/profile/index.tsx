import { Screen } from '@/components/ui/screen';
import { Authenticated, GuestOnly } from '@/features/auth/components/auth-gate';
import { ProfilePage } from '@/features/profile/profile-page';
import { useUser } from '@clerk/expo';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

// imports for authentication and guest mode
import { Button, ButtonText } from '@/components/ui/button';
import { DrawerModal } from '@/components/ui/drawer';
import { useUploadMedia } from '@/features/create/hooks/use-upload-media';
import { GuestMode } from '@/features/profile/components/guest-mode';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Text } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const updateAvatarUrl = useMutation(api.users.updateAvatarUrl);
  const { uploadMedia } = useUploadMedia();
  const [isPickerDrawerOpen, setIsPickerDrawerOpen] = useState(false);

  const { isSignedIn } = useUser();
  const profile = useQuery(api.users.getCurrentProfile, isSignedIn ? {} : 'skip');
  const friends = useQuery(api.data_ml.friends.getFriends, isSignedIn ? {} : 'skip');
  const feedPosts = useQuery(
    api.users.getProfileFeed,
    profile ? { userId: profile.user._id } : 'skip'
  );

  async function handlePickFromGallery() {
    setIsPickerDrawerOpen(false);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Gallery access is needed to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    try {
      const storageId = await uploadMedia(asset.uri, asset.mimeType ?? 'image/jpeg');
      await updateAvatarUrl({ storageId });

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      await clerkUser?.setProfileImage({ file: blob });
    } catch (error) {
      Alert.alert('Error', 'Could not update profile picture. Please try again.');
      console.error('Avatar update failed', error);
    }
  }

  return (
    <Screen className="flex-1">
      <GuestOnly>
        <GuestMode />
      </GuestOnly>
      <Authenticated>
        {profile ? (
          <>
            <ProfilePage
              profile={profile}
              feedPosts={feedPosts ?? []}
              secondaryStat={{
                label: 'Friends',
                value: friends?.length ?? 0,
                onPress: () => router.push('/profile/friends?source=profile'),
              }}
              activityLabel="Recent Activity"
              onPressSettings={() => router.push('/profile/settings')}
              onPressAvatar={() => setIsPickerDrawerOpen(true)}
              topPaddingClassName="pt-20"
              bioFallback="No bio yet."
            />
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
                <Button
                  onPress={() => void handlePickFromGallery()}
                  accessibilityLabel="Choose from gallery"
                >
                  <ButtonText>Choose from gallery</ButtonText>
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => setIsPickerDrawerOpen(false)}
                  accessibilityLabel="Cancel"
                >
                  <ButtonText variant="ghost">Cancel</ButtonText>
                </Button>
              </BottomSheetView>
            </DrawerModal>
          </>
        ) : (
          <ScrollView className="flex-1 bg-background" />
        )}
      </Authenticated>
    </Screen>
  );
}
