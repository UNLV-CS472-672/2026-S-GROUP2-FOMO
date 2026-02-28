import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-app-background p-6">
      <Text className="text-[30px] font-bold leading-8 text-app-text">Profile</Text>
      <Text className="text-center text-base leading-6 text-app-text">
        Account, preferences, and friends will live here.
      </Text>

      <Button variant="secondary" className="mt-2" onPress={() => router.push('/profile/friends')}>
        <ButtonText variant="secondary">Friends</ButtonText>
      </Button>

      <Button variant="secondary" className="mt-2" onPress={() => router.push('/profile/settings')}>
        <ButtonText variant="secondary">Settings</ButtonText>
      </Button>
    </View>
  );
}
