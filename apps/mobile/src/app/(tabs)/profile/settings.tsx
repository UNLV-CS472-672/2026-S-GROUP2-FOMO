import { Button, ButtonText } from '@/components/ui/button';
import { useAuth } from '@clerk/expo';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  async function handleLogout() {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await signOut();
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
