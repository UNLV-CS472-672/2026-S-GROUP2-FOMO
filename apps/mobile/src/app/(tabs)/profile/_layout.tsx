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
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="media-feed" options={{ title: 'Media' }} />
    </Stack>
  );
}
