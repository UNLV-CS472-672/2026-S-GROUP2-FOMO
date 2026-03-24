import { useAuth, useSSO } from '@clerk/expo';
import type { SignUpResource } from '@clerk/shared/types';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';

WebBrowser.maybeCompleteAuthSession(); // complete any pending provider sign in

type SocialProvider = 'google';
type PendingUsernameSetup = {
  signUp: SignUpResource;
  setActive: ((params: { session: string }) => Promise<void>) | undefined;
};

type UseSsoArgs = {
  clearErrors: () => void;
  handleError: (error: unknown) => void;
  mode?: 'signin' | 'signup';
};

export function useSso({ clearErrors, handleError, mode = 'signup' }: UseSsoArgs) {
  const { isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [pendingUsernameSetup, setPendingUsernameSetup] = useState<PendingUsernameSetup | null>(
    null
  );
  const [isCompletingUsername, setIsCompletingUsername] = useState(false);
  const allowSignUp = mode === 'signup';

  const isUsernameMissing = (signUp: SignUpResource | undefined): signUp is SignUpResource =>
    !!signUp &&
    signUp.status === 'missing_requirements' &&
    Array.isArray(signUp.missingFields) &&
    signUp.missingFields.includes('username');

  const signInWith = async (provider: SocialProvider) => {
    if (isSignedIn || loadingProvider) return;

    setLoadingProvider(provider);
    setPendingUsernameSetup(null);
    clearErrors();

    try {
      const redirectUrl = Linking.createURL('/', { scheme: 'fomo' });
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: `oauth_${provider}`,
        redirectUrl,
      });

      if (!allowSignUp) {
        const isSignInComplete = signIn?.status === 'complete';
        const didEnterSignUpFlow = !!signUp && signUp.status !== 'abandoned';

        if (!isSignInComplete && didEnterSignUpFlow) {
          handleError(new Error('No account found for this provider. Please sign up first.'));
          return;
        }
      }

      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        return;
      }

      if (isUsernameMissing(signUp)) {
        setPendingUsernameSetup({
          signUp,
          setActive: setActive
            ? async ({ session }: { session: string }) => {
                await setActive({ session });
              }
            : undefined,
        });
        return;
      }

      handleError(
        new Error(
          allowSignUp ? 'Unable to complete social sign up.' : 'Unable to complete social sign in.'
        )
      );
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const completeSignUpWithUsername = async (username: string) => {
    if (!pendingUsernameSetup || isCompletingUsername) return;

    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;

    setIsCompletingUsername(true);
    clearErrors();

    try {
      const signUpAttempt = await pendingUsernameSetup.signUp.update({
        username: trimmedUsername,
      });

      if (signUpAttempt.status === 'complete' && signUpAttempt.createdSessionId) {
        await pendingUsernameSetup.setActive?.({ session: signUpAttempt.createdSessionId });
        setPendingUsernameSetup(null);
        return;
      }

      if (isUsernameMissing(signUpAttempt)) {
        setPendingUsernameSetup((current) =>
          current ? { ...current, signUp: signUpAttempt } : current
        );
        return;
      }

      handleError(new Error('Unable to finish creating your account.'));
    } catch (error) {
      handleError(error);
    } finally {
      setIsCompletingUsername(false);
    }
  };

  return {
    loadingProvider,
    signInWith,
    pendingUsernameSetup,
    isCompletingUsername,
    completeSignUpWithUsername,
  };
}
