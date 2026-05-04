import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { Stack } from 'expo-router';

export default function SecurityLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerLeft: () => <AppHeaderBackButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Security' }} />
      <Stack.Screen name="connected-accounts" options={{ title: 'Connected Accounts' }} />
      <Stack.Screen name="active-devices" options={{ title: 'Active Devices' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
    </Stack>
  );
}
