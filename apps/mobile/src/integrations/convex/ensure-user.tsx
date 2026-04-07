import { api } from '@fomo/backend/convex/_generated/api';
import { useConvexAuth, useMutation } from 'convex/react';
import { useEffect } from 'react';

/**
 * Keeps Convex `users` in sync with Clerk: after a JWT is active, ensures a row
 * exists for `identity.tokenIdentifier` (see `users.ensureCurrentUser`).
 * Renders nothing; safe to call repeatedly (mutation is idempotent).
 */
export function EnsureConvexUser() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureUser = useMutation(api.users.ensureCurrentUser);

  useEffect(() => {
    // Wait until Convex has finished exchanging the Clerk token; guest mode stays unauthenticated.
    if (!isAuthenticated || isLoading) {
      return;
    }
    void ensureUser();
  }, [ensureUser, isAuthenticated, isLoading]);

  return null;
}
