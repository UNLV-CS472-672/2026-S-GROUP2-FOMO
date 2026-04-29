import { Button, ButtonText } from '@/components/ui/button';
import { DrawerModal } from '@/components/ui/drawer';
import { Screen } from '@/components/ui/screen';
import { Authenticated, GuestOnly } from '@/features/auth/components/auth-gate';
import { GuestMode } from '@/features/profile/components/guest-mode';
import { ProfilePage } from '@/features/profile/profile-page';
import { useAppTheme } from '@/lib/use-app-theme';
import { useUser } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const updateAvatarUrl = useMutation(api.users.updateAvatarUrl);
  const [isPickerDrawerOpen, setIsPickerDrawerOpen] = useState(false);

  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getCurrentProfile, isAuthenticated ? {} : 'skip');
  const friends = useQuery(api.data_ml.friends.getFriends, isAuthenticated ? {} : 'skip');
  const friendRequests = useQuery(api.friends.getFriendRequests, isAuthenticated ? {} : 'skip');
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
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const image = await clerkUser?.setProfileImage({ file: blob });
      const avatarUrl = image?.publicUrl;

      if (!avatarUrl) {
        throw new Error('Could not resolve Clerk avatar URL.');
      }

      await updateAvatarUrl({ avatarUrl });
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
              viewerUserId={profile.user._id}
              profileAction={
                <ProfileRequestsButton
                  count={friendRequests?.received.length ?? 0}
                  onPress={() => router.push('/profile/friend-requests')}
                />
              }
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

function ProfileRequestsButton({ count, onPress }: { count: number; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <View>
      <Pressable
        accessibilityLabel="Friend requests"
        accessibilityRole="button"
        className="size-12 items-center justify-center rounded-full bg-card shadow-sm"
        hitSlop={10}
        style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] }]}
        onPress={onPress}
      >
        <MaterialIcons name="person-add-alt-1" size={20} color={theme.tint} />
      </Pressable>
      {count > 0 ? (
        <View className="absolute -right-1 -top-1 min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
          <ButtonText className="text-xs text-primary-foreground">
            {count > 9 ? '9+' : count}
          </ButtonText>
        </View>
      ) : null}
    </View>
  );
}
