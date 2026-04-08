import '@/global.css';

import { useAuth } from '@clerk/expo';
import { navigationThemeColors } from '@fomo/theme/native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useConvexAuth } from 'convex/react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import ClerkProvider from '@/integrations/clerk/provider';
import ConvexProvider from '@/integrations/convex/provider';
import GuestProvider, { useGuest } from '@/integrations/session/provider';

function RootNavigator() {
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isGuestMode, isGuestLoading } = useGuest();
  const segments = useSegments();

  const authState =
    !isClerkLoaded || isGuestLoading || isLoading || (isSignedIn && !isAuthenticated)
      ? 'loading'
      : isAuthenticated
        ? 'authenticated'
        : isGuestMode
          ? 'guest'
          : 'unauthenticated';

  if (authState === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const isAuthenticatedRouteAllowed = segments[0] === '(tabs)' || segments[0] === 'feed';

  if (authState === 'authenticated' && !isAuthenticatedRouteAllowed) {
    return <Redirect href="/(tabs)/(map)" />;
  }

  if (authState === 'unauthenticated' && segments[0] !== '(auth)') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <>
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
    </>
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
