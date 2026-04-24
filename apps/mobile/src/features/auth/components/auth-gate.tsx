import { useConvexAuth } from 'convex/react';
import type { ReactNode } from 'react';

import { useGuest } from '@/integrations/session/guest';

type AuthGateProps = {
  children: ReactNode;
};

function AuthGate({ children, when }: AuthGateProps & { when: boolean }) {
  if (!when) {
    return null;
  }

  return <>{children}</>;
}

export function Authenticated({ children }: AuthGateProps) {
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const { isGuestLoading } = useGuest();
  const isLoading = isConvexLoading || isGuestLoading;

  return <AuthGate when={!isLoading && isAuthenticated}>{children}</AuthGate>;
}

export function Unauthenticated({ children }: AuthGateProps) {
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const { isGuestLoading, isGuestMode } = useGuest();
  const isLoading = isConvexLoading || isGuestLoading;
  const isUnauthenticated = !isLoading && !isAuthenticated && !isGuestMode;

  return <AuthGate when={!isLoading && isUnauthenticated}>{children}</AuthGate>;
}

export function GuestOnly({ children }: AuthGateProps) {
  const { isLoading: isConvexLoading } = useConvexAuth();
  const { isGuestLoading, isGuestMode } = useGuest();
  const isLoading = isConvexLoading || isGuestLoading;

  return <AuthGate when={!isLoading && isGuestMode}>{children}</AuthGate>;
}

export function AuthLoading({ children }: AuthGateProps) {
  const { isLoading: isConvexLoading } = useConvexAuth();
  const { isGuestLoading } = useGuest();
  const isLoading = isConvexLoading || isGuestLoading;

  return <AuthGate when={isLoading}>{children}</AuthGate>;
}
