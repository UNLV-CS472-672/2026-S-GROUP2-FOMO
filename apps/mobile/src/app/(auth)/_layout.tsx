import { HeaderBackButton } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';

function AuthBackButton() {
  const router = useRouter();

  return (
    <HeaderBackButton
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/profile');
        }
      }}
    />
  );
}

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
          headerLeft: () => <AuthBackButton />,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign up',
          headerBackButtonMenuEnabled: true,
          headerLeft: () => <AuthBackButton />,
        }}
      />
    </Stack>
  );
}
