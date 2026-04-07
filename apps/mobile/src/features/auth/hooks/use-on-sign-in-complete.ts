import { api } from '@fomo/backend/convex/_generated/api';
import { useMutation } from 'convex/react';

type ActivateSession = (params: { session: string }) => Promise<void>;

type OnSignInCompleteArgs = {
  sessionId: string;
  setActive?: ActivateSession;
};

export function useOnSignInComplete() {
  const ensureUser = useMutation(api.users.ensureCurrentUser);

  return async function onSignInComplete({ sessionId, setActive }: OnSignInCompleteArgs) {
    if (!setActive || !sessionId) return;
    await setActive({ session: sessionId });
    await ensureUser();
  };
}
