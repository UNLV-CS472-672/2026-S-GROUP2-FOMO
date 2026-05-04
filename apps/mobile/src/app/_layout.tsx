import '@/global.css';

import { useAuth as useClerkAuth } from '@clerk/expo';
import { api } from '@fomo/backend/convex/_generated/api';
import { navigationThemeColors } from '@fomo/theme/native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useConvexAuth, useQuery } from 'convex/react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { AuthLoadingScreen } from '@/features/auth/components/auth-loading-screen';
import ClerkProvider from '@/integrations/clerk/provider';
import ConvexProvider from '@/integrations/convex/provider';
import GuestProvider, { useGuest } from '@/integrations/session/guest';
import { UserProvider } from '@/integrations/session/user';

function RootNavigator() {
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkAuthenticated } = useClerkAuth();
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const { isGuestLoading, isGuestMode } = useGuest();
  const segments = useSegments();
  const tagPreferences = useQuery(
    api.tags.getCurrentUserTagPreferences,
    isAuthenticated ? {} : 'skip'
  );
  const isLoading = isConvexLoading || isGuestLoading;
  const isOnboardingRoute = segments[0] === '(onboarding)';
  const isTagPreferencesLoading =
    isAuthenticated && (tagPreferences === undefined || tagPreferences === null);
  const needsInterestOnboarding = tagPreferences?.hasCompletedSelection === false;

  const isAuthResolving =
    !isClerkLoaded ||
    isLoading ||
    (isClerkAuthenticated && !isAuthenticated) ||
    isTagPreferencesLoading;
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

  if (isAuthenticated && needsInterestOnboarding && !isOnboardingRoute) {
    return <Redirect href="/(onboarding)/interests" />;
  }

  if (isAuthenticated && !needsInterestOnboarding && isOnboardingRoute) {
    return <Redirect href="/(tabs)/(map)" />;
  }

  const isAuthenticatedRouteAllowed = segments[0] === '(tabs)' || isOnboardingRoute;
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
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <ClerkProvider>
          <ConvexProvider>
            <GuestProvider>
              <UserProvider>
                <BottomSheetModalProvider>
                  <RootNavigator />
                  <StatusBar style={isDark ? 'light' : 'dark'} />
                </BottomSheetModalProvider>
              </UserProvider>
            </GuestProvider>
          </ConvexProvider>
        </ClerkProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
