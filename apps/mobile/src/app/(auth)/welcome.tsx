import darkLogo from '@/assets/logos/fomo-dark.png';
import lightLogo from '@/assets/logos/fomo-light.png';
import { Image } from '@/components/image';
import { Button, ButtonText } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useGuest } from '@/integrations/session/guest';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useUniwind } from 'uniwind';

export default function Welcome() {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const logoSource = isDark ? darkLogo : lightLogo;
  const { enterGuestMode } = useGuest();

  const handleGuestMode = async () => {
    await enterGuestMode();
    router.replace('/(tabs)/(map)');
  };

  const handleAuthNavigation = async (href: '/(auth)/login' | '/(auth)/signup') => {
    router.push(href);
  };

  return (
    <Screen className="items-center justify-center">
      <View>
        <Text className="text-3xl font-bold text-foreground text-center font-heading">
          Welcome to
        </Text>
        <Image
          source={logoSource}
          style={{ width: 320, height: 160, marginTop: 20, alignSelf: 'center' }}
          contentFit="contain"
        />
      </View>

      <View className="mt-10 w-full flex px-12 gap-4">
        <Button onPress={() => void handleAuthNavigation('/(auth)/login')}>
          <ButtonText>Login</ButtonText>
        </Button>
        <Button onPress={() => void handleAuthNavigation('/(auth)/signup')}>
          <ButtonText>Sign up</ButtonText>
        </Button>

        <Button variant="ghost" onPress={() => void handleGuestMode()}>
          <ButtonText variant="ghost">Guest mode</ButtonText>
        </Button>
      </View>
    </Screen>
  );
}
