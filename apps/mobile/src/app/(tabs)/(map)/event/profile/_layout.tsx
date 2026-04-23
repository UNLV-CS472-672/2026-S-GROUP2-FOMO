import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { Stack } from 'expo-router';

export default function EventProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="[username]"
        options={{
          headerShown: true,
          title: 'Profile',
          headerLeft: () => <AppHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="media-feed"
        options={{
          headerShown: true,
          title: 'Posts',
          headerLeft: () => <AppHeaderBackButton />,
        }}
      />
    </Stack>
  );
}
