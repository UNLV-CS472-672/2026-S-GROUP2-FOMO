import { useGuest } from '@/integrations/session/provider';
import { useConvexAuth } from 'convex/react';

type AuthState = {
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
  isGuestLoading: boolean;
  isGuestMode: boolean;
  isLoading: boolean;
};

export function useAppAuthState(): AuthState {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isGuestLoading, isGuestMode } = useGuest();
  const isAuthLoading = isLoading || isGuestLoading;

  return {
    isAuthenticated,
    isGuestLoading,
    isGuestMode,
    isLoading: isAuthLoading,
    isUnauthenticated: !isAuthLoading && !isAuthenticated && !isGuestMode,
  };
}
