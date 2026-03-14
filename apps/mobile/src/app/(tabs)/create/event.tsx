import { useGuest } from '@/integrations/session/provider';
import { Redirect } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function CreateEventScreen() {
  const { isGuestMode } = useGuest();

  if (isGuestMode) {
    return <Redirect href="/create" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-app-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        rowGap: 8,
      }}
    >
      <Text className="text-[30px] font-bold leading-8 text-app-text">Create Event</Text>
      <Text className="text-center text-base leading-6 text-app-text">
        Event composer form goes here.
      </Text>
    </ScrollView>
  );
}
