import { buildClerkErrorState, clearAuthErrors, SignUpErrors } from '@/features/auth/utils/errors';
import {
  buildIncompleteSignUpMessage,
  buildMissingRequirementsMessage,
  getClerkStatus,
  isMissingRequirements,
  isUsernameMissing,
} from '@/features/auth/utils/username-requirements';
import { useAuth } from '@clerk/expo';
import { useSignUp } from '@clerk/expo/legacy';
import type { SignUpResource } from '@clerk/shared/types';
import { useState } from 'react';

type SignUpStatus = 'idle' | 'submitting' | 'verifying' | 'resending';

type PendingUsernameSetup = {
  signUp: SignUpResource;
  emailAddress: string;
};

type SignUpMeta = {
  status?: string | null;
  _status?: string | null;
  createdSessionId?: string | null;
  missingFields?: readonly string[] | null;
};

export function useSignup() {
  const { isSignedIn } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();

  // state
  const [username, setUsernameValue] = useState('');
  const [emailAddress, setEmailAddressValue] = useState('');
  const [password, setPasswordValue] = useState('');
  const [code, setCodeValue] = useState('');
  const [status, setStatus] = useState<SignUpStatus>('idle');
  const [errors, setErrors] = useState<SignUpErrors | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [codeSentMessage, setCodeSentMessage] = useState<string | null>(null);
  const [pendingUsernameSetup, setPendingUsernameSetup] = useState<PendingUsernameSetup | null>(
    null
  );

  // derived
  const shouldShowAuthLoader = !isLoaded || Boolean(isSignedIn);
  const authLoadingMessage = isSignedIn ? 'Finishing sign in...' : 'Loading authentication...';

  // ------- state setters -------
  const setUsername = (value: string) => {
    setUsernameValue(value);
    setErrors((current) => clearAuthErrors(current, ['username', 'global']));
  };

  const setEmailAddress = (value: string) => {
    setEmailAddressValue(value);
    setErrors((current) => clearAuthErrors(current, ['email', 'global']));
  };

  const setPassword = (value: string) => {
    setPasswordValue(value);
    setErrors((current) => clearAuthErrors(current, ['password', 'global']));
  };

  const setCode = (value: string) => {
    setCodeValue(value);
    setErrors((current) => clearAuthErrors(current, ['code', 'global']));
  };

  const handleClerkError = (error: unknown, noParamFallback: keyof SignUpErrors = 'global') => {
    setErrors(
      buildClerkErrorState({
        error,
        paramMap: {
          username: 'username',
          email_address: 'email',
          password: 'password',
          code: 'code',
        },
        noParamFallback,
      })
    );
  };
  const clearErrors = () => setErrors(null);
  const handleSsoError = (error: unknown) => handleClerkError(error);

  const completeSignUpWithUsername = async (value: string) => {
    if (!isLoaded || isSignedIn || status !== 'idle' || !pendingUsernameSetup) return;

    const trimmedUsername = value.trim();
    if (!trimmedUsername) return;

    setErrors(null);
    setStatus('submitting');

    try {
      const signUpAttempt = await pendingUsernameSetup.signUp.update({ username: trimmedUsername });
      const signUpAttemptMeta = signUpAttempt as SignUpMeta;

      if (getClerkStatus(signUpAttemptMeta) === 'complete' && signUpAttemptMeta.createdSessionId) {
        await setActive({ session: signUpAttemptMeta.createdSessionId });
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
        handleClerkError(
          new Error(buildMissingRequirementsMessage(signUpAttemptMeta.missingFields))
        );
        return;
      }

      handleClerkError(new Error(buildIncompleteSignUpMessage(getClerkStatus(signUpAttemptMeta))));
    } catch (err) {
      handleClerkError(err);
    } finally {
      setStatus('idle');
    }
  };

  // -------  actions -------
  const onSignUpPress = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;

    const trimmedEmail = emailAddress.trim();
    if (!trimmedEmail || !password) return;

    setErrors(null);
    setStatus('submitting');
    setPendingUsernameSetup(null);

    try {
      await signUp.create({ emailAddress: trimmedEmail, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      setCodeSentMessage('We sent a verification code to your email address.');
    } catch (err) {
      handleClerkError(err);
    } finally {
      setStatus('idle');
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;

    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setErrors(null);
    setStatus('verifying');

    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: trimmedCode });
      const attemptMeta = attempt as SignUpMeta;

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        return;
      }

      if (isUsernameMissing(attempt, attemptMeta)) {
        setPendingVerification(false);
        setPendingUsernameSetup({
          signUp: attempt,
          emailAddress: emailAddress.trim(),
        });
        return;
      }

      if (isMissingRequirements(attemptMeta)) {
        handleClerkError(new Error(buildMissingRequirementsMessage(attemptMeta.missingFields)));
      }
    } catch (err) {
      handleClerkError(err, 'code');
    } finally {
      setStatus('idle');
    }
  };

  const onResendPress = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;

    setErrors(null);
    setStatus('resending');

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setCodeSentMessage('Verification code resent.');
    } catch (err) {
      handleClerkError(err);
    } finally {
      setStatus('idle');
    }
  };

  return {
    state: {
      username,
      emailAddress,
      password,
      code,
      pendingVerification,
      pendingUsernameSetup,
      codeSentMessage,
      errors,
      isSubmitting: status === 'submitting',
      isVerifying: status === 'verifying',
      isResending: status === 'resending',
    },
    shouldShowAuthLoader,
    authLoadingMessage,
    setUsername,
    setEmailAddress,
    setPassword,
    setCode,
    clearErrors,
    handleSsoError,
    completeSignUpWithUsername,
    onSignUpPress,
    onVerifyPress,
    onResendPress,
  };
}
