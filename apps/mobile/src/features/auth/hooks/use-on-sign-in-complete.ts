import { api } from '@fomo/backend/convex/_generated/api';
import { useMutation } from 'convex/react';

type ActivateSession = (params: { session: string }) => Promise<void>;

type OnSignInCompleteArgs = {
  sessionId: string | null | undefined;
  setActive?: ActivateSession | null;
};

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

    await ensureUser({});
  };
}
