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
        }}
      />
      <Stack.Screen
        name="gallery"
        options={{
          presentation: 'fullScreenModal',
          title: 'Gallery',
        }}
      />
      <Stack.Screen
        name="post-preview"
        options={{
          presentation: 'fullScreenModal',
          title: 'Preview',
        }}
      />
    </Stack>
  );
}
