import { useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Authenticated, GuestOnly } from '@/features/auth/components/auth-gate';
import { GuestMode } from '@/features/profile/components/guest-mode';

export default function CreateScreen() {
  const { push } = useRouter();

  return (
    <Screen>
      <GuestOnly>
        <GuestMode />
      </GuestOnly>

      <Authenticated>
        <ScrollView
          className="flex-1 gap-3"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            rowGap: 12,
          }}
        >
          <Text className="text-[30px] font-bold leading-8 text-foreground">Create</Text>
          <Text className="text-base leading-6 text-foreground">
            Choose what you want to publish.
          </Text>

          <Button
            variant="secondary"
            size="lg"
            className="items-start text-xl font-semibold"
            onPress={() => push('/create/event')}
          >
            <ButtonText variant="secondary" className="text-xl">
              Create Event
            </ButtonText>
            <ButtonText className="mt-1 text-base leading-6 text-foreground">
              Host an event with location, time, and details.
            </ButtonText>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="items-start text-xl font-semibold"
            onPress={() => push('/create/post')}
          >
            <ButtonText variant="secondary" className="text-xl">
              Create Post
            </ButtonText>
            <ButtonText className="mt-1 text-base leading-6 text-foreground">
              Share an update, photo, or thought with the community.
            </ButtonText>
          </Button>
        </ScrollView>
      </Authenticated>
    </Screen>
  );
}
