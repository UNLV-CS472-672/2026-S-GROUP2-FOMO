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
  const { theme: activeTheme } = useUniwind();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isDarkMode = activeTheme === 'dark';

  function handleThemeToggle(value: boolean) {
    Uniwind.setTheme(value ? 'dark' : 'light');
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

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="grow p-6 gap-2"
    >
      <Text className="text-[30px] font-bold leading-8 text-foreground">Settings</Text>
      <Text className="text-base leading-6 text-foreground">
        Notification, privacy, and account preferences go here.
      </Text>
      <View className="mt-6 rounded-2xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-base font-semibold text-foreground">Dark mode</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Switch between light and dark app themes.
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={handleThemeToggle}
            accessibilityLabel="Toggle dark mode"
          />
        </View>
      </View>
      <View className="mt-4">
        <Button variant="secondary" onPress={() => router.push('/(tabs)/profile/edit' as never)}>
          <ButtonText variant="secondary">Edit profile</ButtonText>
        </Button>
      </View>
      <View className="mt-6">
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
  );
}
