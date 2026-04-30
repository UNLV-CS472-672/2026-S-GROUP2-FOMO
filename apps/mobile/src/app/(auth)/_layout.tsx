import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerLeft: () => <AppHeaderBackButton />,
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{
          title: 'Log in',
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign up',
          headerBackButtonMenuEnabled: true,
        }}
      />
      <Stack.Screen name="gallery-picker" options={{ title: 'Choose Photo' }} />
    </Stack>
  );
}
