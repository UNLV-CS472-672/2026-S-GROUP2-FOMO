import '@/global.css';

import { useAuth as useClerkAuth } from '@clerk/expo';
import { navigationThemeColors } from '@fomo/theme/native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useConvexAuth } from 'convex/react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { AuthLoadingScreen } from '@/features/auth/components/auth-loading-screen';
import ClerkProvider from '@/integrations/clerk/provider';
import ConvexProvider from '@/integrations/convex/provider';
import GuestProvider, { useGuest } from '@/integrations/session/provider';

function RootNavigator() {
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkAuthenticated } = useClerkAuth();
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const { isGuestLoading, isGuestMode } = useGuest();
  const segments = useSegments();
  const isLoading = isConvexLoading || isGuestLoading;

  const isAuthResolving = !isClerkLoaded || isLoading || (isClerkAuthenticated && !isAuthenticated);
  if (isAuthResolving) {
    return (
      <AuthLoadingScreen
        isClerkLoaded={isClerkLoaded}
        isClerkAuthenticated={isClerkAuthenticated}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />
    );
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
