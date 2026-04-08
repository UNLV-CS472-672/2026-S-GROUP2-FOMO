import { useConvexAuth } from 'convex/react';
import type { ReactNode } from 'react';

import { useGuest } from '@/integrations/session/provider';

type AuthGateProps = {
  children: ReactNode;
};

type AuthState = {
  isAuthenticated: boolean;
  isGuestMode: boolean;
  isLoading: boolean;
  isUnauthenticated: boolean;
};

function AuthGate({ children, when }: AuthGateProps & { when: boolean }) {
  if (!when) {
    return null;
  }

  return <>{children}</>;
}

export function useAppAuthState(): AuthState {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isGuestLoading, isGuestMode } = useGuest();
  const isAuthLoading = isLoading || isGuestLoading;

  return {
    isAuthenticated,
    isGuestMode,
    isLoading: isAuthLoading,
    isUnauthenticated: !isAuthLoading && !isAuthenticated && !isGuestMode,
  };
}

export function Authenticated({ children }: AuthGateProps) {
  const { isLoading, isAuthenticated } = useAppAuthState();

  return <AuthGate when={!isLoading && isAuthenticated}>{children}</AuthGate>;
}

export function Unauthenticated({ children }: AuthGateProps) {
  const { isLoading, isUnauthenticated } = useAppAuthState();

  return <AuthGate when={!isLoading && isUnauthenticated}>{children}</AuthGate>;
}

export function GuestOnly({ children }: AuthGateProps) {
  const { isLoading, isGuestMode } = useAppAuthState();

  return <AuthGate when={!isLoading && isGuestMode}>{children}</AuthGate>;
}

export function AuthLoading({ children }: AuthGateProps) {
  const { isLoading } = useAppAuthState();

  return <AuthGate when={isLoading}>{children}</AuthGate>;
}

export {
  Authenticated as AppAuthenticated,
  GuestOnly as AppGuestOnly,
  Unauthenticated as AppUnauthenticated,
};
