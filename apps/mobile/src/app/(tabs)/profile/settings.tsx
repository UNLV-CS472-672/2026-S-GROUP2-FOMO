import { Button, ButtonText } from '@/components/ui/button';
import { DrawerModal } from '@/components/ui/drawer';
import { AuthInput } from '@/features/auth/components/input';
import { signOutClerkExpo } from '@/features/auth/utils/clerk-sign-out';
import { InterestsPicker } from '@/features/profile/components/interests-picker';
import { SettingsRow } from '@/features/profile/components/settings-row';
import { SettingsSectionLabel } from '@/features/profile/components/settings-section-label';
import { ThemePicker } from '@/features/profile/components/theme-picker';
import { useClerk, useUser } from '@clerk/expo';
import { api } from '@fomo/backend/convex/_generated/api';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';

const DELETE_ACCOUNT_CONFIRMATION = 'Delete account';

export default function SettingsScreen() {
  const clerk = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [interestsOpen, setInterestsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const blockedUsers = useQuery(api.moderation.block.getBlockedUsers, {});
  const blockedCount = blockedUsers?.length;

  const canDeleteAccount = deleteConfirmation.trim() === DELETE_ACCOUNT_CONFIRMATION;

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  function confirmLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void handleLogout() },
    ]);
  }

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOutClerkExpo(clerk);
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    if (isDeletingAccount || !canDeleteAccount || !user) return;

    setIsDeletingAccount(true);

    try {
      await user.delete();
      setDeleteAccountOpen(false);
      setDeleteConfirmation('');
      await signOutClerkExpo(clerk);
      Alert.alert('Account deleted', 'Your account has been permanently deleted.');
    } catch (error) {
      Alert.alert(
        'Unable to delete account',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="grow p-6 gap-6"
      >
        {/* Profile summary */}
        <View className="items-center gap-3 pb-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} className="h-20 w-20 rounded-full" />
            ) : (
              <Text className="text-2xl font-bold text-primary">{initials}</Text>
            )}
          </View>
          <View className="items-center gap-0.5">
            <Text className="text-lg font-bold text-foreground">
              {user?.fullName ?? user?.username}
            </Text>
            {user?.username && (
              <Text className="text-sm text-muted-foreground">@{user.username}</Text>
            )}
          </View>
        </View>

        {/* Preferences */}
        <View>
          <SettingsSectionLabel>Preferences</SettingsSectionLabel>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <SettingsRow
              icon="color-palette-outline"
              label="Appearance"
              onPress={() => setAppearanceOpen(true)}
            />
            <SettingsRow
              icon="pizza"
              label="Interests"
              onPress={() => setInterestsOpen(true)}
              isLast
            />
          </View>
        </View>

        {/* Account */}
        <View>
          <SettingsSectionLabel>Account</SettingsSectionLabel>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <SettingsRow
              icon="person-outline"
              label="Edit Profile"
              onPress={() => router.push('/(tabs)/profile/edit')}
              isLast
            />
          </View>
        </View>

        {/* Privacy */}
        <View>
          <SettingsSectionLabel>Privacy</SettingsSectionLabel>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <SettingsRow
              icon="ban-outline"
              label="Blocked Users"
              value={blockedCount}
              onPress={() => router.push('/(tabs)/profile/blocked-users')}
              isLast
            />
          </View>
        </View>

        {/* Log out */}
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <SettingsRow
            icon="log-out-outline"
            label={isSigningOut ? 'Logging out...' : 'Log out'}
            onPress={confirmLogout}
            isLast
          />
        </View>

        {/* Danger zone */}
        <View>
          <SettingsSectionLabel>Danger zone</SettingsSectionLabel>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <SettingsRow
              icon="trash-outline"
              label="Delete Account"
              onPress={() => setDeleteAccountOpen(true)}
              destructive
              isLast
            />
          </View>
        </View>
      </ScrollView>

      <DrawerModal
        open={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
        snapPoints={['28%']}
        enablePanDownToClose
        backdropAppearsOnIndex={0}
        backdropDisappearsOnIndex={-1}
      >
        <View className="px-6 pb-6 pt-2">
          <Text className="mb-4 text-[17px] font-bold text-foreground">Appearance</Text>
          <ThemePicker />
        </View>
      </DrawerModal>

      <DrawerModal
        open={interestsOpen}
        onClose={() => setInterestsOpen(false)}
        snapPoints={['75%']}
        enablePanDownToClose
        backdropAppearsOnIndex={0}
        backdropDisappearsOnIndex={-1}
      >
        <View className="mx-6 mb-4">
          <Text className="text-[17px] font-bold text-foreground">Interests</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Update the tags that describe what you want to see more of.
          </Text>
        </View>
        <BottomSheetScrollView keyboardShouldPersistTaps="handled">
          <InterestsPicker
            variant="sheet"
            title="Interests"
            subtitle=""
            saveLabel="Save interests"
            savingLabel="Saving..."
            successMessage="Your interests have been updated."
            onSaved={() => setInterestsOpen(false)}
          />
        </BottomSheetScrollView>
      </DrawerModal>

      <DrawerModal
        open={deleteAccountOpen}
        onClose={() => {
          if (isDeletingAccount) return;
          setDeleteAccountOpen(false);
          setDeleteConfirmation('');
        }}
        snapPoints={['55%']}
        enablePanDownToClose={!isDeletingAccount}
        backdropAppearsOnIndex={0}
        backdropDisappearsOnIndex={-1}
        keyboardBehavior="interactive"
      >
        <View className="px-6 pb-8 pt-2">
          <Text className="text-[17px] font-bold text-foreground">Delete account</Text>
          <Text className="mt-2 text-sm leading-6 text-muted-foreground">
            This permanently deletes your Fomo account. Your posts and comments will remain visible
            as <Text className="font-semibold text-foreground">Deleted account</Text>. To confirm,
            type{' '}
            <Text className="font-semibold text-foreground">{DELETE_ACCOUNT_CONFIRMATION}</Text>{' '}
            below.
          </Text>

          <View className="mt-5">
            <AuthInput
              label="Confirmation"
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isDeletingAccount}
              placeholder={DELETE_ACCOUNT_CONFIRMATION}
            />
          </View>

          <View className="mt-6 gap-3">
            <Button
              variant="destructive"
              disabled={!canDeleteAccount || isDeletingAccount}
              onPress={() => void handleDeleteAccount()}
            >
              <ButtonText variant="destructive">
                {isDeletingAccount ? 'Deleting account...' : 'Delete account permanently'}
              </ButtonText>
            </Button>

            <Button
              variant="secondary"
              disabled={isDeletingAccount}
              onPress={() => {
                setDeleteAccountOpen(false);
                setDeleteConfirmation('');
              }}
            >
              <ButtonText variant="secondary">Cancel</ButtonText>
            </Button>
          </View>
        </View>
      </DrawerModal>
    </>
  );
}
