import { AuthPasswordInput } from '@/features/auth/components/password-input';
import { useAppTheme } from '@/lib/use-app-theme';
import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

export default function ChangePasswordScreen() {
  const { user } = useUser();
  const router = useRouter();
  const theme = useAppTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signOutOtherDevices, setSignOutOtherDevices] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const hasPassword = user?.passwordEnabled ?? false;

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSignOutOtherDevices(true);
  }

  function clearErrors() {
    setNewPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
  }

  async function handleSavePassword() {
    if (!user) return;
    clearErrors();

    if (newPassword.length < 8) {
      setNewPasswordError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await user.updatePassword({
        newPassword,
        ...(hasPassword ? { currentPassword } : {}),
        signOutOfOtherSessions: signOutOtherDevices,
      });
      resetForm();
      router.back();
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : 'Unable to update password. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="p-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      {/* header */}
      <View className="gap-1">
        <Text className="text-2xl font-bold text-foreground">
          {hasPassword ? 'Change password' : 'Set a password'}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {hasPassword
            ? 'Enter your current password, then choose a new one.'
            : 'Add a password to sign in to your account directly.'}
        </Text>
      </View>

      {hasPassword && (
        <AuthPasswordInput
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}

      <AuthPasswordInput
        label="New password"
        value={newPassword}
        onChangeText={(v) => {
          setNewPassword(v);
          if (newPasswordError) setNewPasswordError('');
        }}
        placeholder="Enter new password"
        autoCapitalize="none"
        autoCorrect={false}
        error={newPasswordError}
      />

      <AuthPasswordInput
        label="Confirm password"
        value={confirmPassword}
        onChangeText={(v) => {
          setConfirmPassword(v);
          if (confirmPasswordError) setConfirmPasswordError('');
        }}
        placeholder="Re-enter new password"
        autoCapitalize="none"
        autoCorrect={false}
        error={confirmPasswordError}
      />

      {/* sign out other devices */}
      <Pressable
        className="flex-row items-start gap-3"
        onPress={() => setSignOutOtherDevices((v) => !v)}
      >
        <View
          className={`mt-0.5 h-5 w-5 items-center justify-center rounded-sm border ${
            signOutOtherDevices ? 'border-primary bg-primary' : 'border-border bg-background'
          }`}
        >
          {signOutOtherDevices && (
            <Ionicons name="checkmark" size={13} color={theme.tintForeground} />
          )}
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-medium text-foreground">Sign out of all other devices</Text>
          <Text className="text-xs text-muted-foreground">
            {/* NOTE: same as clerk msg on web */}
            It is recommended to sign out of all other devices which may have used your old
            password.
          </Text>
        </View>
      </Pressable>

      {/* general error */}
      {generalError ? <Text className="text-xs text-destructive">{generalError}</Text> : null}

      {/* actions */}
      <View className="flex-row items-center justify-end gap-4 pt-2">
        <Pressable
          onPress={() => {
            resetForm();
            router.back();
          }}
          disabled={isSaving}
        >
          <Text className="text-base font-medium text-primary">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => void handleSavePassword()}
          disabled={isSaving || !newPassword || !confirmPassword}
          className="rounded-xl bg-primary px-5 py-2.5"
          style={{ opacity: !newPassword || !confirmPassword ? 0.5 : 1 }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.tintForeground} />
          ) : (
            <Text className="text-sm font-semibold text-primary-foreground">Save</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
