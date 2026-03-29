import { AuthHeaderBackButton } from '@/features/auth/components/header-back-button';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{
          title: 'Log in',
          headerLeft: () => <AuthHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign up',
          headerBackButtonMenuEnabled: true,
          headerLeft: () => <AuthHeaderBackButton />,
        }}
      />
    </Stack>
  );
}
