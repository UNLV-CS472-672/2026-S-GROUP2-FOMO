import { buildClerkErrorState, clearAuthErrors, LoginErrors } from '@/features/auth/utils/errors';
import { useAuth } from '@clerk/expo';
import { useSignIn } from '@clerk/expo/legacy';
import { useState } from 'react';

type AuthMethod = 'password' | 'email_code';
type LoginStatus = 'idle' | 'submitting' | 'sending_code' | 'code_sent' | 'verifying_code';

export function useLogin() {
  const { isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();

  // state
  const [authMethod, setAuthMethodValue] = useState<AuthMethod>('password');
  const [identifier, setIdentifierValue] = useState('');
  const [password, setPasswordValue] = useState('');
  const [code, setCodeValue] = useState('');
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [errors, setErrors] = useState<LoginErrors | null>(null);

  // derived state
  const isSubmitting =
    status === 'submitting' || status === 'sending_code' || status === 'verifying_code';
  const isCodeSent = status === 'code_sent' || status === 'verifying_code';
  const shouldShowAuthLoader = !isLoaded || Boolean(isSignedIn);
  const authLoadingMessage = isSignedIn ? 'Finishing sign in...' : 'Loading authentication...';

  // ------- state setters -------
  const setAuthMethod = (value: AuthMethod) => {
    setAuthMethodValue(value);
    setErrors(null);
    setStatus('idle');
    if (value === 'password') setCodeValue('');
    else setPasswordValue('');
  };

  const setIdentifier = (value: string) => {
    setIdentifierValue(value);
    setErrors((current) => clearAuthErrors(current, ['identifier', 'global']));
    if (authMethod === 'email_code') setStatus('idle');
  };

  const setPassword = (value: string) => {
    setPasswordValue(value);
    setErrors((current) => clearAuthErrors(current, ['password', 'global']));
  };

  const setCode = (value: string) => {
    setCodeValue(value);
    setErrors((current) => clearAuthErrors(current, ['code', 'global']));
  };

  const handleClerkError = (error: unknown) => {
    setErrors(
      buildClerkErrorState({
        error,
        paramMap: { identifier: 'identifier', password: 'password', code: 'code' },
      })
    );
  };
  const clearErrors = () => setErrors(null);

  // -------  actions -------
  const onSignInPress = async () => {
    if (authMethod !== 'password') return;
    if (!isLoaded || isSignedIn || status !== 'idle') return;

    const trimmedId = identifier.trim();
    if (!trimmedId || !password) return;

    setErrors(null);
    setStatus('submitting');

    try {
      const result = await signIn.create({ identifier: trimmedId, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err) {
      handleClerkError(err);
    } finally {
      setStatus('idle');
    }
  };

  const onSendCodePress = async () => {
    if (!isLoaded || isSignedIn || status !== 'idle') return;

    const trimmedId = identifier.trim();
    if (!trimmedId) return;

    setErrors(null);
    setStatus('sending_code');

    try {
      await signIn.create({ identifier: trimmedId });

      const emailFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      if (!emailFactor || !('emailAddressId' in emailFactor) || !emailFactor.emailAddressId) {
        setErrors({ global: 'Email code sign-in is not available for this account.' });
        setStatus('idle');
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setStatus('code_sent');
    } catch (err) {
      handleClerkError(err);
      setStatus('idle');
    }
  };

  const onVerifyCodePress = async () => {
    if (!isLoaded || isSignedIn || status !== 'code_sent') return;

    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setErrors(null);
    setStatus('verifying_code');
    let didComplete = false;

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: trimmedCode,
      });

      if (result.status === 'complete') {
        didComplete = true;
        await setActive({ session: result.createdSessionId });
      }
    } catch (err) {
      handleClerkError(err);
    } finally {
      setStatus(didComplete ? 'idle' : 'code_sent');
    }
  };

  return {
    state: {
      authMethod,
      identifier,
      password,
      code,
      isSubmitting,
      isCodeSent,
      errors,
    },
    shouldShowAuthLoader,
    authLoadingMessage,
    setAuthMethod,
    setIdentifier,
    setPassword,
    setCode,
    clearErrors,
    handleSsoError: handleClerkError,
    onSignInPress,
    onSendCodePress,
    onVerifyCodePress,
  };
}
