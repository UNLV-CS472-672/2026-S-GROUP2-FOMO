import { useAuth } from '@clerk/clerk-expo';
import { useConvexAuth } from 'convex/react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { GuestMode } from '@/components/profile/guest-mode';
import { Button, ButtonText } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useGuest } from '@/integrations/session/provider';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut, userId } = useAuth();
  const { isGuestMode } = useGuest();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Screen className="items-center justify-center gap-3 p-6">
      <Text className="text-[30px] font-bold leading-8 text-app-text">Profile</Text>
      {isGuestMode ? (
        <GuestMode />
      ) : (
        <>
          <Text className="text-center text-base leading-6 text-app-text">
            Account, preferences, and friends will live here.
          </Text>
          <Text className="text-center text-base leading-6 text-app-text">
            {`isAuthenticated: ${isAuthenticated}\n`}
            {`isLoading: ${isLoading}\n`}
            {`userId: ${userId}`}
          </Text>

          <Button
            variant="secondary"
            className="mt-2"
            onPress={() => router.push('/profile/friends')}
          >
            <ButtonText variant="secondary">Friends</ButtonText>
          </Button>

          <Button
            variant="secondary"
            className="mt-2"
            onPress={() => router.push('/profile/settings')}
          >
            <ButtonText variant="secondary">Settings</ButtonText>
          </Button>

          <Button variant="secondary" className="mt-2" onPress={handleLogout}>
            <ButtonText variant="secondary">Log out</ButtonText>
          </Button>
        </>
      )}
    </Screen>
  );
}
