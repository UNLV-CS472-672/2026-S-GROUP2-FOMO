import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { Stack } from 'expo-router';

export default function EventLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="[eventId]"
        options={{
          headerShown: true,
          title: 'Event Details',
          headerLeft: () => <AppHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="top-moments"
        options={{
          headerShown: true,
          title: 'Top Moments',
          headerLeft: () => <AppHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="attendees"
        options={{
          headerShown: true,
          title: 'Attendees',
          headerLeft: () => <AppHeaderBackButton />,
        }}
      />
    </Stack>
  );
}
