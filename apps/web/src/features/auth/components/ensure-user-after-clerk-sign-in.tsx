'use client';

import { Show } from '@clerk/nextjs';
import { api } from '@fomo/backend/convex/_generated/api';
import { useConvexAuth, useMutation } from 'convex/react';
import { useEffect } from 'react';

/**
 * Hosted `<SignIn />` / modals do not expose an `afterSignIn` callback. `<Show when="signed-in">` is Clerk’s
 * supported “there is an active session” boundary. Once Convex reports `isAuthenticated` (JWT ready),
 * call `ensureCurrentUser` (idempotent if the effect runs more than once).
 */
export function EnsureUserAfterClerkSignIn() {
  return (
    <Show when="signed-in">
      <EnsureConvexUserRow />
    </Show>
  );
}

function EnsureConvexUserRow() {
  const { isAuthenticated } = useConvexAuth();
  const ensureUser = useMutation(api.auth.ensureCurrentUser);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const runEnsureUser = async () => {
      try {
        await ensureUser({});
      } catch (error) {
        console.error('Failed to ensure current Convex user after sign-in', error);
      }
    };

    void runEnsureUser();
  }, [ensureUser, isAuthenticated]);

  return null;
}
