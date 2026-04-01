import { Button, ButtonText } from '@/components/ui/button';
import { useGuest } from '@/integrations/session/provider';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function CreatePostScreen() {
  const { isGuestMode } = useGuest();
  const { push } = useRouter();

  if (isGuestMode) {
    return <Redirect href="/create" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        rowGap: 8,
      }}
    >
      <Text className="text-[30px] font-bold leading-8 text-foreground">Create Post</Text>
      <Text className="text-center text-base leading-6 text-foreground">
        Post composer form goes here.
      </Text>
      <Button
        variant="secondary"
        size="lg"
        className="items-start text-xl font-semibold"
        onPress={() => push('/create/camera-screen')}
      >
        <ButtonText variant="secondary" className="text-xl">
          Access Camera
        </ButtonText>
        <ButtonText className="mt-1 text-base leading-6 text-app-text">
          Host an event with location, time, and details.
        </ButtonText>
      </Button>
    </ScrollView>
  );
}
