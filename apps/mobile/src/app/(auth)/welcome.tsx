import { Button, ButtonText } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useGuest } from '@/integrations/session/provider';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

export default function Welcome() {
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
        <Image source={require('@/assets/images/icon.png')} className="w-24 h-24 mt-4" />
        <Text className="text-3xl font-medium text-app-text text-center">Welcome to</Text>
        <Text className="text-[6rem] font-heading font-black text-app-text text-center">fomo</Text>
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
