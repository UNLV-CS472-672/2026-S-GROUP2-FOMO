import { Button, ButtonText } from '@/components/ui/button';
import { signOutClerkExpo } from '@/features/auth/utils/clerk-sign-out';
import { useClerk } from '@clerk/expo';
import { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';

export default function SettingsScreen() {
  const clerk = useClerk();
  const { theme } = useUniwind();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isDarkModeEnabled = theme === 'dark';

  function handleDarkModeToggle(enabled: boolean) {
    Uniwind.setTheme(enabled ? 'dark' : 'light');
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
      <View className="mt-6 flex-row items-center justify-between rounded-2xl border border-border px-4 py-3">
        <Text className="text-base font-semibold text-foreground">Dark Mode</Text>
        <Switch
          value={isDarkModeEnabled}
          onValueChange={handleDarkModeToggle}
          accessibilityLabel="Dark mode"
        />
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
