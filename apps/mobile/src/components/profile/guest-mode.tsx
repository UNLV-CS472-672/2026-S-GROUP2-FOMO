import { useRouter } from 'expo-router';
import { Text } from 'react-native';

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
    <>
      <Text className="text-center text-base leading-6 text-app-text">
        You are browsing in guest mode. This is a read-only experience.
      </Text>
      <Button className="mt-2" onPress={() => void handleSignIn()}>
        <ButtonText>Log in</ButtonText>
      </Button>
      <Button variant="secondary" className="mt-2" onPress={() => void handleSignUp()}>
        <ButtonText variant="secondary">Create account</ButtonText>
      </Button>
    </>
  );
}
