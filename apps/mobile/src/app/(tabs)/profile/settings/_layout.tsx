import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerLeft: () => <AppHeaderBackButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="support" options={{ title: 'Support' }} />
      <Stack.Screen name="blocked-users" options={{ title: 'Blocked Users' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="security" options={{ headerShown: false }} />
      <Stack.Screen
        name="gallery-picker"
        options={{
          title: 'Gallery',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 280,
        }}
      />
    </Stack>
  );
}
