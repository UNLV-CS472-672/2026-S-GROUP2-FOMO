import { FomoLogo } from '@/components/fomo-logo';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';

type GuestModeProps = {
  compensateForOverlayTabBar?: boolean;
};

export function GuestMode({ compensateForOverlayTabBar = false }: GuestModeProps) {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const handleSignIn = async () => {
    router.push('/(auth)/login');
  };

  const handleSignUp = async () => {
    router.push('/(auth)/signup');
  };
  return (
    <View
      className="flex-1 justify-center px-8"
      style={compensateForOverlayTabBar ? { paddingBottom: tabBarHeight } : undefined}
    >
      <View className="mb-6 items-center">
        <Text className="text-center text-3xl font-bold text-foreground">Welcome to</Text>
        <FomoLogo width={220} height={96} className="mt-4" />
      </View>
      <Text className="mb-6 text-center leading-6 text-foreground">
        You are browsing in guest mode. This is a read-only experience.
      </Text>
      <Button className="mt-2" onPress={() => void handleSignIn()}>
        <ButtonText>Log in</ButtonText>
      </Button>
      <Button variant="secondary" className="mt-2" onPress={() => void handleSignUp()}>
        <ButtonText variant="secondary">Create account</ButtonText>
      </Button>
    </View>
  );
}
