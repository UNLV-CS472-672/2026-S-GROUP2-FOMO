import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerLeft: () => <AppHeaderBackButton />,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[username]" /> {/* NOTE :: header handled inside the [username] screen */}
      <Stack.Screen name="friends" options={{ title: 'Friends' }} />
      <Stack.Screen name="friend-requests" options={{ title: 'Friend Requests' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen
        name="gallery-picker"
        options={{
          title: 'Gallery',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 280,
        }}
      />
      <Stack.Screen name="media-feed" options={{ title: 'Media' }} />
    </Stack>
  );
}
