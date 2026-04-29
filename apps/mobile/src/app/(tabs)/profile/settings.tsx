import { Button, ButtonText } from '@/components/ui/button';
import { signOutClerkExpo } from '@/features/auth/utils/clerk-sign-out';
import { useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';

export default function SettingsScreen() {
  const clerk = useClerk();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { theme } = useUniwind();
  const isDarkMode = theme === 'dark';

  async function handleLogout() {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await signOutClerkExpo(clerk);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="grow p-6 gap-4"
    >
      <Text className="text-[30px] font-bold leading-8 text-foreground">Settings</Text>

      <View className="flex-row items-center justify-between rounded-xl bg-card px-4 py-3">
        <Text className="text-base text-foreground">Dark Mode</Text>
        <Switch
          value={isDarkMode}
          onValueChange={(val) => Uniwind.setTheme(val ? 'dark' : 'light')}
          accessibilityLabel="Toggle dark mode"
        />
      </View>

      <Button
        variant="secondary"
        onPress={() => router.push('/(tabs)/profile/edit' as never)}
        accessibilityLabel="Edit profile"
      >
        <ButtonText variant="secondary">Edit Profile</ButtonText>
      </Button>

      <Button
        variant="destructive"
        onPress={() => void handleLogout()}
        disabled={isSigningOut}
        accessibilityLabel="Log out"
      >
        <ButtonText variant="destructive">{isSigningOut ? 'Logging out...' : 'Log out'}</ButtonText>
      </Button>
    </ScrollView>
  );
}
