import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { Stack } from 'expo-router';

export default function MapLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="event/[eventId]"
        options={{
          headerShown: true,
          title: 'Event Details',
          headerLeft: () => <AppHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="event/attendees"
        options={{
          headerShown: true,
          title: 'Attendees',
          headerLeft: () => <AppHeaderBackButton />,
        }}
      />
    </Stack>
  );
}
