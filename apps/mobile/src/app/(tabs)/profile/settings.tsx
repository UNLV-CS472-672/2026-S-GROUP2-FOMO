import { Button, ButtonText } from '@/components/ui/button';
import { DrawerModal } from '@/components/ui/drawer';
import { AuthInput } from '@/features/auth/components/input';
import { signOutClerkExpo } from '@/features/auth/utils/clerk-sign-out';
import { InterestsPicker } from '@/features/profile/components/interests-picker';
import { ThemePicker } from '@/features/profile/components/theme-picker';
import { useAppTheme } from '@/lib/use-app-theme';
import { useClerk, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

const DELETE_ACCOUNT_CONFIRMATION = 'Delete account';

export default function SettingsScreen() {
  const clerk = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const theme = useAppTheme();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [interestsOpen, setInterestsOpen] = useState(false);

  const canDeleteAccount = deleteConfirmation.trim() === DELETE_ACCOUNT_CONFIRMATION;

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
      router.replace('/(auth)/welcome' as never);
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
        contentContainerClassName="grow p-6 gap-4"
      >
        <ThemePicker />

        <Pressable
          className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5"
          onPress={() => setInterestsOpen(true)}
          accessibilityRole="button"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="pizza" size={20} color={theme.tint} />
            <Text className="text-base font-medium text-foreground">Interests</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.mutedText} />
        </Pressable>

        <Pressable
          className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5"
          onPress={() => router.push('/(tabs)/profile/edit' as never)}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="person-outline" size={20} color={theme.tint} />
            <Text className="text-base font-medium text-foreground">Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.mutedText} />
        </Pressable>

        <Pressable
          className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5"
          onPress={() => setDeleteAccountOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
            <Text className="text-base font-medium text-destructive">Delete Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.mutedText} />
        </Pressable>

        <View className="mt-2">
          <Button
            variant="destructive"
            onPress={() => void handleLogout()}
            disabled={isSigningOut}
            accessibilityLabel="Log out"
          >
            <ButtonText variant="destructive">
              {isSigningOut ? 'Logging out...' : 'Log out'}
            </ButtonText>
          </Button>
        </View>
      </ScrollView>

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
