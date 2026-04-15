import { useOnSignInComplete } from '@/features/auth/hooks/use-on-sign-in-complete';
import { buildClerkErrorState, clearAuthErrors, LoginErrors } from '@/features/auth/utils/errors';
import { isClerkAPIResponseError, useAuth } from '@clerk/expo';
import { useSignIn } from '@clerk/expo/legacy';
import { useState } from 'react';

type LoginStep = 'identifier' | 'challenge';
type ChallengeMethod = 'email_code' | 'password';
type LoginStatus =
  | 'idle'
  | 'sending_code'
  | 'resending_code'
  | 'verifying_code'
  | 'submitting_password';

export function useLogin() {
  const { isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const onSignInComplete = useOnSignInComplete();

  // state
  const [step, setStep] = useState<LoginStep>('identifier');
  const [challengeMethod, setChallengeMethod] = useState<ChallengeMethod>('email_code');
  const [identifier, setIdentifierValue] = useState('');
  const [password, setPasswordValue] = useState('');
  const [code, setCodeValue] = useState('');
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [errors, setErrors] = useState<LoginErrors | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [hasPreparedEmailCodeChallenge, setHasPreparedEmailCodeChallenge] = useState(false);
  const [emailCodeUnavailable, setEmailCodeUnavailable] = useState(false);

  // derived state
  const isBusy = status !== 'idle';
  const shouldShowAuthLoader = !isLoaded || Boolean(isSignedIn);
  const authLoadingMessage = isSignedIn ? 'Finishing sign in...' : 'Loading authentication...';

  // ------- state setters -------
  const clearErrors = () => setErrors(null);

  const handleClerkError = (error: unknown) => {
    setErrors(
      buildClerkErrorState({
        error,
        paramMap: { identifier: 'identifier', password: 'password', code: 'code' },
      })
    );
  };

  const setIdentifier = (value: string) => {
    setIdentifierValue(value);
    setErrors((current) => clearAuthErrors(current, ['identifier', 'global']));
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
  type SendCodeResult = 'success' | 'email_unavailable' | 'error';

  const isEmailUnavailableError = (error: unknown): boolean =>
    isClerkAPIResponseError(error) &&
    error.errors?.some((e) => {
      const normalizedMessage = e.message?.toLowerCase() ?? '';
      const normalizedCode = e.code?.toLowerCase() ?? '';

      return (
        e.code === 'sending_sms_rate_limited' ||
        normalizedCode.includes('rate_limit') ||
        normalizedCode.includes('email') ||
        normalizedCode.includes('message') ||
        normalizedMessage.includes('monthly limit') ||
        normalizedMessage.includes('email') ||
        normalizedMessage.includes('message')
      );
    });

  const sendCode = async (
    nextStatus: 'sending_code' | 'resending_code'
  ): Promise<SendCodeResult> => {
    if (!isLoaded || isSignedIn || status !== 'idle') return 'error';

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) return 'error';

    setErrors(null);
    setStatus(nextStatus);

    try {
      await signIn.create({ identifier: trimmedIdentifier });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to create sign-in', error);
      }

      if (isEmailUnavailableError(error)) {
        setStatus('idle');
        return 'email_unavailable';
      }

      handleClerkError(error);
      setStatus('idle');
      return 'error';
    }

    try {
      const emailFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      if (!emailFactor || !('emailAddressId' in emailFactor) || !emailFactor.emailAddressId) {
        setErrors({ global: 'Email code sign-in is not available for this account.' });
        setStatus('idle');
        return 'error';
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setHasPreparedEmailCodeChallenge(true);
      setResendAvailableAt(Date.now() + 60_000);
      setStatus('idle');
      return 'success';
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to send login code', error);
      }

      setStatus('idle');
      if (isEmailUnavailableError(error)) {
        if (__DEV__) {
          console.error('Email code rate limited, falling back to password', error);
        }
        return 'email_unavailable';
      }

      handleClerkError(error);
      return 'error';
    }
  };

  const continueWithIdentifier = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;
    if (!identifier.trim()) return;

    setErrors(null);
    setChallengeMethod('email_code');
    setCodeValue('');
    setPasswordValue('');
    setResendAvailableAt(null);
    setHasPreparedEmailCodeChallenge(false);
    setEmailCodeUnavailable(false);

    const result = await sendCode('sending_code');
    if (result === 'success') {
      setStep('challenge');
    } else if (result === 'email_unavailable') {
      setStep('challenge');
      setChallengeMethod('password');
      setEmailCodeUnavailable(true);
    }
  };

  const switchChallengeMethod = async (value: ChallengeMethod) => {
    if (challengeMethod === value) return;

    const previousMethod = challengeMethod;
    setChallengeMethod(value);
    setErrors((current) => clearAuthErrors(current, ['code', 'password', 'global']));

    if (value === 'password') {
      setCodeValue('');
      return;
    }

    setPasswordValue('');

    const canSendCode = !resendAvailableAt || resendAvailableAt <= Date.now();
    if (step === 'challenge' && canSendCode) {
      const result = await sendCode('sending_code');

      if (result !== 'success') {
        setChallengeMethod(previousMethod);
      }
    }
  };

  const goBack = () => {
    if (isBusy) return;

    setStep('identifier');
    setChallengeMethod('email_code');
    setCodeValue('');
    setPasswordValue('');
    setResendAvailableAt(null);
    setHasPreparedEmailCodeChallenge(false);
    setErrors(null);
  };

  const onResendCodePress = async () => {
    if (challengeMethod !== 'email_code') return;
    if (resendAvailableAt && resendAvailableAt > Date.now()) return;
    await sendCode('resending_code');
  };

  const onVerifyCodePress = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;
    if (
      step !== 'challenge' ||
      challengeMethod !== 'email_code' ||
      !hasPreparedEmailCodeChallenge
    ) {
      return;
    }

    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setErrors(null);
    setStatus('verifying_code');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: trimmedCode,
      });

      if (result.status === 'complete') {
        await onSignInComplete({ sessionId: result.createdSessionId, setActive });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to verify login code', error);
      }

      handleClerkError(error);
    } finally {
      setStatus('idle');
    }
  };

  const onPasswordSignInPress = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) return;

    setErrors(null);
    setStatus('submitting_password');

    try {
      const result = await signIn.create({ identifier: trimmedIdentifier, password });
      if (result.status === 'complete') {
        await onSignInComplete({ sessionId: result.createdSessionId, setActive });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to sign in with password', error);
      }

      handleClerkError(error);
    } finally {
      setStatus('idle');
    }
  };

  return {
    state: {
      step,
      challengeMethod,
      identifier,
      password,
      code,
      resendAvailableAt,
      hasPreparedEmailCodeChallenge,
      emailCodeUnavailable,
      errors,
      isBusy,
      isSendingCode: status === 'sending_code',
      isResendingCode: status === 'resending_code',
      isVerifyingCode: status === 'verifying_code',
      isSigningInWithPassword: status === 'submitting_password',
    },
    shouldShowAuthLoader,
    authLoadingMessage,
    setIdentifier,
    setPassword,
    setCode,
    clearErrors,
    handleSsoError: handleClerkError,
    continueWithIdentifier,
    switchChallengeMethod,
    goBack,
    onResendCodePress,
    onVerifyCodePress,
    onPasswordSignInPress,
  };
}
