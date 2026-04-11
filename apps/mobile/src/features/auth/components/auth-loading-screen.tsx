import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

type AuthLoadingScreenProps = {
  isClerkLoaded: boolean;
  isClerkAuthenticated?: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function AuthLoadingScreen({
  isClerkLoaded,
  isClerkAuthenticated,
  isAuthenticated,
  isLoading,
}: AuthLoadingScreenProps) {
  const isWaitingForClerk = !isClerkLoaded;
  const isWaitingForConvexAuth = isLoading;
  const isWaitingForSessionSync = isClerkAuthenticated && !isAuthenticated;

  const loadingReason = isWaitingForClerk
    ? 'Waiting for Clerk to hydrate the auth session.\n'
    : isWaitingForConvexAuth
      ? 'Waiting for Convex auth to load guest mode or auth state.\n'
      : isWaitingForSessionSync
        ? 'Waiting for the Convex session to catch up after Clerk sign-in.\n'
        : 'Resolving auth state.\n';

  useEffect(() => {
    if (!__DEV__) return;

    console.log('[auth loading]', loadingReason, {
      clerkLoaded: isClerkLoaded,
      convexLoading: isLoading,
      clerkSignedIn: isClerkAuthenticated,
      convexAuthenticated: isAuthenticated,
    });
  }, [isAuthenticated, isClerkAuthenticated, isClerkLoaded, isLoading, loadingReason]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator />
    </View>
  );
}
