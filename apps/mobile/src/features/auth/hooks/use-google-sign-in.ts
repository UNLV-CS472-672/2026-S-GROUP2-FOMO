import {
  buildIncompleteSignUpMessage,
  buildMissingRequirementsMessage,
  getClerkStatus,
  isMissingRequirements,
  isUsernameMissing,
} from '@/features/auth/utils/username-requirements';
import { useAuth } from '@clerk/expo';
import { useSignInWithGoogle } from '@clerk/expo/google';
import type { SignUpResource } from '@clerk/shared/types';
import { useState } from 'react';
import { Platform } from 'react-native';

type SocialProvider = 'google';

type SignInMeta = {
  status?: string | null;
  _status?: string | null;
  createdSessionId?: string | null;
  firstFactorVerification?: {
    status?: string | null;
  } | null;
  secondFactorVerification?: {
    status?: string | null;
  } | null;
};

type SignUpMeta = {
  status?: string | null;
  _status?: string | null;
  createdSessionId?: string | null;
  missingFields?: readonly string[] | null;
  emailAddress?: string | null;
  emailAddresses?: { emailAddress?: string | null }[] | null;
};

type PendingUsernameSetup = {
  signUp: SignUpResource;
  setActive: ((params: { session: string }) => Promise<void>) | undefined;
  emailAddress?: string | null;
};

type AuthFlowError = {
  code?: string;
  message?: string;
};

type UseGoogleSignInArgs = {
  clearErrors: () => void;
  handleError: (error: unknown) => void;
  intent?: 'signin' | 'signup';
  setEmailAddress?: (value: string) => void;
};

function getPendingEmailAddress(signUp: SignUpMeta | undefined) {
  return signUp?.emailAddress ?? signUp?.emailAddresses?.[0]?.emailAddress ?? null;
}

function isAuthFlowError(error: unknown): error is AuthFlowError {
  return !!error && typeof error === 'object';
}

function isGoogleFlowCancelled(error: unknown) {
  return isAuthFlowError(error) && (error.code === 'SIGN_IN_CANCELLED' || error.code === '-5');
}

function buildNoGoogleAccountMessage() {
  return 'There is no account connected to this Google login yet. Sign up first, or use your email and password instead.';
}

function buildUnhandledGoogleAuthMessage({
  signIn,
  signUp,
}: {
  signIn?: SignInMeta;
  signUp?: SignUpMeta;
}) {
  const details = [
    getClerkStatus(signIn) ? `sign in status: ${getClerkStatus(signIn)}` : null,
    getClerkStatus(signUp) ? `sign up status: ${getClerkStatus(signUp)}` : null,
    Array.isArray(signUp?.missingFields) && signUp.missingFields.length > 0
      ? `missing fields: ${signUp.missingFields.join(', ')}`
      : null,
    signIn?.firstFactorVerification?.status
      ? `first factor: ${signIn.firstFactorVerification.status}`
      : null,
    signIn?.secondFactorVerification?.status
      ? `second factor: ${signIn.secondFactorVerification.status}`
      : null,
  ].filter(Boolean);

  if (details.length === 0) {
    return 'Google authentication did not return a completed Clerk session. Please try again.';
  }

  return `Google authentication did not finish. Clerk returned ${details.join('; ')}.`;
}

function getResolvedSessionId({
  createdSessionId,
  signIn,
  signUp,
}: {
  createdSessionId?: string | null;
  signIn?: SignInMeta;
  signUp?: SignUpMeta;
}) {
  return createdSessionId ?? signIn?.createdSessionId ?? signUp?.createdSessionId ?? null;
}

export function useGoogleSignIn({
  clearErrors,
  handleError,
  intent = 'signin',
  setEmailAddress,
}: UseGoogleSignInArgs) {
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();

  // state
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [pendingUsernameSetup, setPendingUsernameSetup] = useState<PendingUsernameSetup | null>(
    null
  );
  const [isCompletingUsername, setIsCompletingUsername] = useState(false);

  // derived state
  const isSignupIntent = intent === 'signup';

  // ------- actions -------
  const signInWith = async (provider: SocialProvider) => {
    if (provider !== 'google' || isSignedIn || loadingProvider) return;

    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      handleError(new Error('Google sign in is only available on iOS and Android builds.'));
      return;
    }

    setLoadingProvider(provider);
    setPendingUsernameSetup(null);
    clearErrors();

    try {
      const result = await startGoogleAuthenticationFlow();

      if (__DEV__) {
        console.log('[google auth] completed', {
          createdSessionId: result.createdSessionId,
          hasSetActive: Boolean(result.setActive),
          signInStatus: getClerkStatus(result.signIn as SignInMeta | undefined),
          signUpStatus: getClerkStatus(result.signUp as (SignUpResource & SignUpMeta) | undefined),
        });
      }

      const signIn = result.signIn as SignInMeta | undefined;
      const signUpResource = result.signUp as SignUpResource | undefined;
      const signUpMeta = result.signUp as (SignUpResource & SignUpMeta) | undefined;
      const resolvedSessionId = getResolvedSessionId({
        createdSessionId: result.createdSessionId,
        signIn,
        signUp: signUpMeta,
      });

      if (resolvedSessionId && result.setActive) {
        await result.setActive({ session: resolvedSessionId });
        return;
      }

      if (isUsernameMissing(signUpResource, signUpMeta)) {
        if (!signUpResource) {
          handleError(new Error('Unable to continue Google sign up. Please try again.'));
          return;
        }

        const pendingEmailAddress = getPendingEmailAddress(signUpMeta);
        if (pendingEmailAddress) {
          setEmailAddress?.(pendingEmailAddress);
        }

        setPendingUsernameSetup({
          signUp: signUpResource,
          emailAddress: pendingEmailAddress,
          setActive: result.setActive
            ? async ({ session }: { session: string }) => {
                await result.setActive?.({ session });
              }
            : undefined,
        });
        return;
      }

      if (isMissingRequirements(signUpMeta)) {
        handleError(new Error(buildMissingRequirementsMessage(signUpMeta?.missingFields)));
        return;
      }

      if (getClerkStatus(signIn) === 'needs_second_factor') {
        handleError(
          new Error(
            'This account requires additional verification. Use your email or username sign in instead.'
          )
        );
        return;
      }

      if (getClerkStatus(signIn) === 'needs_new_password') {
        handleError(
          new Error('This account requires a password reset before Google sign in can continue.')
        );
        return;
      }

      if (!isSignupIntent && getClerkStatus(signUpMeta) === 'abandoned') {
        handleError(new Error(buildNoGoogleAccountMessage()));
        return;
      }

      if (__DEV__) {
        console.warn('[google auth] unhandled result', {
          createdSessionId: result.createdSessionId,
          signInStatus: getClerkStatus(signIn),
          signInFirstFactorStatus: signIn?.firstFactorVerification?.status ?? null,
          signInSecondFactorStatus: signIn?.secondFactorVerification?.status ?? null,
          signUpStatus: getClerkStatus(signUpMeta),
          signUpMissingFields: signUpMeta?.missingFields ?? null,
          signUpCreatedSessionId: signUpMeta?.createdSessionId ?? null,
        });
      }

      handleError(new Error(buildUnhandledGoogleAuthMessage({ signIn, signUp: signUpMeta })));
    } catch (error) {
      if (isGoogleFlowCancelled(error)) {
        return;
      }

      if (__DEV__) {
        console.error('Google auth flow failed', error);
      }

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
      const signUpAttempt = await pendingUsernameSetup.signUp.update({ username: trimmedUsername });
      const signUpAttemptMeta = signUpAttempt as SignUpMeta;

      if (getClerkStatus(signUpAttemptMeta) === 'complete' && signUpAttemptMeta.createdSessionId) {
        if (!pendingUsernameSetup.setActive) {
          throw new Error('Expected Clerk setActive after Google sign-up completion.');
        }
        await pendingUsernameSetup.setActive({
          session: signUpAttemptMeta.createdSessionId,
        });
        setPendingUsernameSetup(null);
        return;
      }

      if (isUsernameMissing(signUpAttempt, signUpAttemptMeta)) {
        setPendingUsernameSetup((current) =>
          current ? { ...current, signUp: signUpAttempt } : current
        );
        return;
      }

      if (isMissingRequirements(signUpAttemptMeta)) {
        handleError(new Error(buildMissingRequirementsMessage(signUpAttemptMeta.missingFields)));
        return;
      }

      handleError(new Error(buildIncompleteSignUpMessage(getClerkStatus(signUpAttemptMeta))));
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
