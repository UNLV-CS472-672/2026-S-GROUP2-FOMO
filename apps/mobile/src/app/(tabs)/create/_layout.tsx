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
        name="gallery"
        options={{
          presentation: 'modal',
          title: 'Gallery',
          animation: 'slide_from_bottom',
          animationDuration: 280,
        }}
      />
      <Stack.Screen
        name="media-preview"
        options={{
          presentation: 'fullScreenModal',
          title: 'Preview',
          animation: 'slide_from_bottom',
          animationDuration: 280,
        }}
      />
    </Stack>
  );
}
