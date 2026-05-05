import { signOutClerkExpo } from '@/features/auth/utils/clerk-sign-out';
import { DeleteAccountDrawer } from '@/features/profile/components/security/delete-account-drawer';
import { SettingsRow } from '@/features/profile/components/settings-row';
import { SettingsSectionLabel } from '@/features/profile/components/settings-section-label';
import { useClerk, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

export default function SecurityScreen() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const router = useRouter();

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);

  async function handleDeleteAccount() {
    if (isDeletingAccount || !user) return;
    setIsDeletingAccount(true);
    try {
      await user.delete();
      setShowDeleteDrawer(false);
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

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="p-6 gap-6"
      >
        <View>
          <SettingsSectionLabel>Password</SettingsSectionLabel>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <SettingsRow
              icon="key-outline"
              label={user?.passwordEnabled ? 'Change Password' : 'Set Password'}
              onPress={() => router.push('/(tabs)/profile/settings/security/change-password')}
              isLast
            />
          </View>
        </View>

        <View>
          <SettingsSectionLabel>Devices</SettingsSectionLabel>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <SettingsRow
              icon="phone-portrait-outline"
              label="Active Devices"
              onPress={() => router.push('/(tabs)/profile/settings/security/active-devices')}
              isLast
            />
          </View>
        </View>

        <View>
          <SettingsSectionLabel>Account</SettingsSectionLabel>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <SettingsRow
              icon="link-outline"
              label="Connected Accounts"
              onPress={() => router.push('/(tabs)/profile/settings/security/connected-accounts')}
              isLast
            />
          </View>
        </View>

        <View>
          <SettingsSectionLabel>Danger Zone</SettingsSectionLabel>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <SettingsRow
              icon="trash-outline"
              label="Delete Account"
              onPress={() => setShowDeleteDrawer(true)}
              destructive
              isLast
            />
          </View>
        </View>
      </ScrollView>

      <DeleteAccountDrawer
        open={showDeleteDrawer}
        isDeletingAccount={isDeletingAccount}
        onClose={() => setShowDeleteDrawer(false)}
        onDeleteAccount={() => void handleDeleteAccount()}
      />
    </>
  );
}
