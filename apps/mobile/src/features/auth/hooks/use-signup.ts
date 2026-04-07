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
import { api } from '@fomo/backend/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useState } from 'react';

type SignUpStep = 'identifier' | 'verify' | 'password' | 'username';
type SignUpStatus =
  | 'idle'
  | 'sending_code'
  | 'resending_code'
  | 'verifying'
  | 'submitting_password'
  | 'submitting_username';

type SignUpMeta = {
  status?: string | null;
  _status?: string | null;
  createdSessionId?: string | null;
  missingFields?: readonly string[] | null;
};

type UsernameEntryStep = 'verify' | 'password';

function includesMissingField(meta: SignUpMeta, field: string) {
  return Array.isArray(meta.missingFields) && meta.missingFields.includes(field);
}

function isAlreadyVerifiedError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return error.message.toLowerCase().includes('verification has already been verified');
}

function getNextIncompleteStep(
  signUp: SignUpResource | null | undefined,
  meta: SignUpMeta | undefined
) {
  if (includesMissingField(meta ?? {}, 'password')) {
    return 'password' as const;
  }

  if (isUsernameMissing(signUp ?? undefined, meta)) {
    return 'username' as const;
  }

  return null;
}

export function useSignup() {
  const { isSignedIn } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();
  const ensureUser = useMutation(api.users.ensureCurrentUser);

  // state
  const [step, setStep] = useState<SignUpStep>('identifier');
  const [username, setUsernameValue] = useState('');
  const [emailAddress, setEmailAddressValue] = useState('');
  const [password, setPasswordValue] = useState('');
  const [code, setCodeValue] = useState('');
  const [status, setStatus] = useState<SignUpStatus>('idle');
  const [errors, setErrors] = useState<SignUpErrors | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [activeSignUp, setActiveSignUp] = useState<SignUpResource | null>(null);
  const [usernameEntryStep, setUsernameEntryStep] = useState<UsernameEntryStep>('password');

  // derived state
  const shouldShowAuthLoader = !isLoaded || Boolean(isSignedIn);
  const authLoadingMessage = isSignedIn ? 'Finishing sign in...' : 'Loading authentication...';
  const isBusy = status !== 'idle';

  // ------- state setters -------
  const clearErrors = () => setErrors(null);

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

  const handleSsoError = (error: unknown) => handleClerkError(error);

  const getCurrentSignUpResource = () => {
    const currentSignUp = activeSignUp ?? signUp;

    if (!currentSignUp) {
      throw new Error('Sign up is not ready yet. Please try again.');
    }

    return currentSignUp;
  };

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

  // ------- actions -------
  const onStartEmailSignUp = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;

    const trimmedEmail = emailAddress.trim();
    if (!trimmedEmail) return;

    setErrors(null);
    setStatus('sending_code');

    try {
      await signUp.create({ emailAddress: trimmedEmail });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setActiveSignUp(signUp);
      setStep('verify');
      setPasswordValue('');
      setUsernameValue('');
      setCodeValue('');
      setResendAvailableAt(Date.now() + 60_000);
      setUsernameEntryStep('password');
    } catch (error) {
      handleClerkError(error);
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
      const currentSignUp = getCurrentSignUpResource();
      const attempt = await currentSignUp.attemptEmailAddressVerification({ code: trimmedCode });
      const attemptMeta = attempt as SignUpMeta;

      setActiveSignUp(attempt);

      if (attempt.status === 'complete') {
        setCodeValue('');
        await setActive({ session: attempt.createdSessionId });
        await ensureUser();
        return;
      }

      const nextStep = getNextIncompleteStep(attempt, attemptMeta);

      if (nextStep === 'password') {
        setCodeValue('');
        setStep('password');
        setUsernameEntryStep('password');
        return;
      }

      if (nextStep === 'username') {
        setCodeValue('');
        setStep('username');
        setUsernameEntryStep('verify');
        return;
      }

      if (isMissingRequirements(attemptMeta)) {
        handleClerkError(new Error(buildMissingRequirementsMessage(attemptMeta.missingFields)));
        return;
      }

      handleClerkError(new Error(buildIncompleteSignUpMessage(getClerkStatus(attemptMeta))));
    } catch (error) {
      if (isAlreadyVerifiedError(error)) {
        const currentSignUp = getCurrentSignUpResource();
        const currentSignUpMeta = currentSignUp as SignUpMeta;
        const nextStep = getNextIncompleteStep(currentSignUp, currentSignUpMeta);

        if (!nextStep) {
          handleClerkError(error, 'code');
          return;
        }

        setErrors(null);
        setCodeValue('');
        setStep(nextStep);
        setUsernameEntryStep(nextStep === 'username' ? 'verify' : 'password');
      } else {
        handleClerkError(error, 'code');
      }
    } finally {
      setStatus('idle');
    }
  };

  const onResendPress = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;
    if (resendAvailableAt && resendAvailableAt > Date.now()) return;

    setErrors(null);
    setStatus('resending_code');

    try {
      const currentSignUp = getCurrentSignUpResource();
      await currentSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setResendAvailableAt(Date.now() + 60_000);
    } catch (error) {
      handleClerkError(error);
    } finally {
      setStatus('idle');
    }
  };

  const onPasswordPress = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;
    if (!password) return;

    setErrors(null);
    setStatus('submitting_password');

    try {
      const currentSignUp = getCurrentSignUpResource();
      const attempt = await currentSignUp.update({ password });
      const attemptMeta = attempt as SignUpMeta;

      setActiveSignUp(attempt);

      if (getClerkStatus(attemptMeta) === 'complete' && attemptMeta.createdSessionId) {
        await setActive({ session: attemptMeta.createdSessionId });
        await ensureUser();
        return;
      }

      if (
        isUsernameMissing(attempt, attemptMeta) ||
        includesMissingField(attemptMeta, 'username')
      ) {
        setStep('username');
        setUsernameEntryStep('password');
        return;
      }

      if (isMissingRequirements(attemptMeta)) {
        handleClerkError(new Error(buildMissingRequirementsMessage(attemptMeta.missingFields)));
        return;
      }

      handleClerkError(new Error(buildIncompleteSignUpMessage(getClerkStatus(attemptMeta))));
    } catch (error) {
      handleClerkError(error, 'password');
    } finally {
      setStatus('idle');
    }
  };

  const completeSignUpWithUsername = async (value: string) => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;

    const trimmedUsername = value.trim();
    if (!trimmedUsername) return;

    setErrors(null);
    setStatus('submitting_username');

    try {
      const currentSignUp = getCurrentSignUpResource();
      const attempt = await currentSignUp.update({ username: trimmedUsername });
      const attemptMeta = attempt as SignUpMeta;

      setActiveSignUp(attempt);

      if (getClerkStatus(attemptMeta) === 'complete' && attemptMeta.createdSessionId) {
        await setActive({ session: attemptMeta.createdSessionId });
        await ensureUser();
        return;
      }

      if (isUsernameMissing(attempt, attemptMeta)) {
        return;
      }

      if (isMissingRequirements(attemptMeta)) {
        handleClerkError(new Error(buildMissingRequirementsMessage(attemptMeta.missingFields)));
        return;
      }

      handleClerkError(new Error(buildIncompleteSignUpMessage(getClerkStatus(attemptMeta))));
    } catch (error) {
      handleClerkError(error, 'username');
    } finally {
      setStatus('idle');
    }
  };

  const goBack = () => {
    if (isBusy) return;

    if (step === 'verify') {
      setStep('identifier');
      setCodeValue('');
      setResendAvailableAt(null);
      setActiveSignUp(null);
      setUsernameEntryStep('password');
      setErrors(null);
      return;
    }

    if (step === 'password') {
      setStep('verify');
      setCodeValue('');
      setPasswordValue('');
      setErrors(null);
      return;
    }

    if (step === 'username') {
      setStep(usernameEntryStep);
      setUsernameValue('');
      setErrors(null);
    }
  };

  return {
    state: {
      step,
      username,
      emailAddress,
      password,
      code,
      resendAvailableAt,
      errors,
      isBusy,
      isSendingCode: status === 'sending_code',
      isResending: status === 'resending_code',
      isVerifying: status === 'verifying',
      isSubmittingPassword: status === 'submitting_password',
      isSubmittingUsername: status === 'submitting_username',
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
    onStartEmailSignUp,
    onVerifyPress,
    onResendPress,
    onPasswordPress,
    goBack,
  };
}
