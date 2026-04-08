import '@/global.css';

import { useAuth as useClerkAuth } from '@clerk/expo';
import { navigationThemeColors } from '@fomo/theme/native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { useAppAuthState } from '@/features/auth/hooks/use-auth-state';
import ClerkProvider from '@/integrations/clerk/provider';
import ConvexProvider from '@/integrations/convex/provider';
import GuestProvider from '@/integrations/session/provider';

function AuthLoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator />
    </View>
  );
}

function RootNavigator() {
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkAuthenticated } = useClerkAuth();
  const { isAuthenticated, isGuestMode, isLoading } = useAppAuthState();
  const segments = useSegments();

  const isAuthResolving = !isClerkLoaded || isLoading || (isClerkAuthenticated && !isAuthenticated);
  if (isAuthResolving) {
    return <AuthLoadingScreen />;
  }

  const isAuthenticatedRouteAllowed = segments[0] === '(tabs)' || segments[0] === 'feed';
  if (isAuthenticated && !isAuthenticatedRouteAllowed) {
    return <Redirect href="/(tabs)/(map)" />;
  }

  const isAuthRoute = segments[0] === '(auth)';
  if (!isAuthenticated && !isGuestMode && !isAuthRoute) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="feed/event/[h3Id]"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Event Details',
          headerLeft: () => <AppHeaderBackButton />,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const { theme: activeTheme } = useUniwind();
  const isDark = activeTheme === 'dark';
  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        ...(isDark ? navigationThemeColors.dark : navigationThemeColors.light),
      },
    }),
    [isDark]
  );

  return (
    <ThemeProvider value={navigationTheme}>
      <ClerkProvider>
        <ConvexProvider>
          <GuestProvider>
            <RootNavigator />
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </GuestProvider>
        </ConvexProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}
