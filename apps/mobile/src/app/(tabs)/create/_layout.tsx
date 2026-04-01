import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackButtonDisplayMode: 'minimal',
        headerLeft: () => <AppHeaderBackButton />,
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
      <Stack.Screen
        name="camera-screen"
        options={{
          presentation: 'fullScreenModal',
          title: 'Camera',
          contentStyle: { backgroundColor: 'black' },
        }}
      />
      <Stack.Screen
        name="gallery-screen"
        options={{
          presentation: 'modal',
          title: 'Gallery',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
