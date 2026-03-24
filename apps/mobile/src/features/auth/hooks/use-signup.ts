import { buildClerkErrorState, clearAuthErrors, SignUpErrors } from '@/features/auth/utils/errors';
import { useAuth } from '@clerk/expo';
import { useSignUp } from '@clerk/expo/legacy';
import { useState } from 'react';

type SignUpStatus = 'idle' | 'submitting' | 'verifying' | 'resending';

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

  // -------  actions -------
  const onSignUpPress = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;

    const trimmedUsername = username.trim();
    const trimmedEmail = emailAddress.trim();
    if (!trimmedUsername || !trimmedEmail || !password) return;

    setErrors(null);
    setStatus('submitting');

    try {
      await signUp.create({ username: trimmedUsername, emailAddress: trimmedEmail, password });
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
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
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
    onSignUpPress,
    onVerifyPress,
    onResendPress,
  };
}
