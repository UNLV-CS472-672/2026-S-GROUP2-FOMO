import { getClerkInstance } from '@clerk/expo';
import { api } from '@fomo/backend/convex/_generated/api';
import { useMutation } from 'convex/react';

type ActivateSession = (params: { session: string }) => Promise<void>;

type OnSignInCompleteArgs = {
  sessionId: string | null | undefined;
  setActive?: ActivateSession | null;
};

type ClerkUserLike = {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
};

type ClerkUserSnapshot = {
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  primaryEmailAddress?: string;
};

function requiredClerkUserSnapshotFromClerkUser(
  user: ClerkUserLike | null | undefined
): ClerkUserSnapshot {
  if (!user) {
    throw new Error('Expected Clerk user after sign-in, but none was available.');
  }

  return {
    username: user.username ?? undefined,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    fullName: user.fullName ?? undefined,
    primaryEmailAddress: user.primaryEmailAddress?.emailAddress ?? undefined,
  };
}

export function useOnSignInComplete() {
  const ensureUser = useMutation(api.users.ensureCurrentUser);

  return async function onSignInComplete({ sessionId, setActive }: OnSignInCompleteArgs) {
    if (!sessionId) {
      throw new Error('Expected a Clerk session ID, but received null/undefined.');
    }

    if (!setActive) {
      throw new Error('Expected Clerk setActive function, but received null/undefined.');
    }

    await setActive({ session: sessionId });

    const clerk = getClerkInstance();
    await clerk.user?.reload();
    const clerkUser = requiredClerkUserSnapshotFromClerkUser(clerk.user);

    await ensureUser({ clerkUser });
  };
}
