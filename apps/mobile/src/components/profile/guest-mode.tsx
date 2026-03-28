import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';

export function GuestMode() {
  const router = useRouter();
  const handleSignIn = async () => {
    router.push('/(auth)/login');
  };

  const handleSignUp = async () => {
    router.push('/(auth)/signup');
  };
  return (
    <View className="flex-1 justify-center px-8">
      <Text className="mb-6 text-center text-3xl font-bold text-app-text">
        Welcome to <Text className="font-heading text-4xl font-black">fomo</Text>
      </Text>
      <Text className="mb-6 text-center leading-6 text-app-text">
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
