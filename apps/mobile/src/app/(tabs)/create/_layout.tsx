import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="event"
        options={{
          presentation: 'modal',
          title: 'Create Event',
        }}
      />
      <Stack.Screen
        name="post"
        options={{
          presentation: 'modal',
          title: 'Create Post',
        }}
      />
    </Stack>
  );
}
