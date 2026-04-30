import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { AuthErrorBanner } from '@/features/auth/components/error';
import { IdentifierStep } from '@/features/auth/components/steps/identifier';
import { PasswordStep } from '@/features/auth/components/steps/password';
import { UsernameStep } from '@/features/auth/components/steps/username';
import { VerificationStep } from '@/features/auth/components/steps/verification';
import { AuthWrapper } from '@/features/auth/components/wrapper';
import { useGoogleSignIn } from '@/features/auth/hooks/use-google-sign-in';
import { useSignup } from '@/features/auth/hooks/use-signup';
import { setPendingSignupAvatar } from '@/features/auth/utils/pending-signup-avatar';
import { useAppTheme } from '@/lib/use-app-theme';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function SignUpScreen() {
  const theme = useAppTheme();
  const {
    state,
    shouldShowAuthLoader,
    authLoadingMessage,
    setUsername,
    setEmailAddress,
    setPassword,
    setCode,
    setAvatarUri,
    clearErrors,
    handleSsoError,
    completeSignUpWithUsername: completeEmailSignUpWithUsername,
    onStartEmailSignUp,
    onVerifyPress,
    onResendPress,
    onPasswordPress,
    goBack,
  } = useSignup();
  const {
    loadingProvider,
    signInWith,
    pendingUsernameSetup,
    isCompletingUsername,
    completeSignUpWithUsername,
  } = useGoogleSignIn({
    clearErrors,
    handleError: handleSsoError,
    intent: 'signup',
    setEmailAddress,
  });
  const navigation = useNavigation();
  const params = useLocalSearchParams<{
    avatarUri?: string | string[];
    avatarFileName?: string | string[];
    avatarNonce?: string | string[];
  }>();

  const avatarUriParam = Array.isArray(params.avatarUri) ? params.avatarUri[0] : params.avatarUri;
  const avatarFileNameParam = Array.isArray(params.avatarFileName)
    ? params.avatarFileName[0]
    : params.avatarFileName;
  const avatarNonceParam = Array.isArray(params.avatarNonce)
    ? params.avatarNonce[0]
    : params.avatarNonce;

  useEffect(() => {
    // console.log('[signup] avatar param effect fired, avatarUriParam:', avatarUriParam);
    if (!avatarUriParam) return;
    setAvatarUri(avatarUriParam, avatarFileNameParam);
    // console.log('[signup] setAvatarUri called with:', avatarUriParam);
  }, [avatarFileNameParam, avatarNonceParam, avatarUriParam]);

  const isGoogleUsernameStep = Boolean(pendingUsernameSetup);
  const screenStep = isGoogleUsernameStep ? 'username' : state.step;
  // console.log('[signup] render — step:', screenStep, 'avatarUri:', state.avatarUri);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        screenStep !== 'identifier' && !pendingUsernameSetup ? (
          <AppHeaderBackButton onPress={goBack} />
        ) : (
          <AppHeaderBackButton />
        ),
    });
  }, [goBack, navigation, pendingUsernameSetup, screenStep]);

  if (shouldShowAuthLoader) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <ActivityIndicator size="large" color={theme.mutedText} />
        <Text className="mt-3 text-sm text-muted-foreground">{authLoadingMessage}</Text>
      </View>
    );
  }

  return (
    <AuthWrapper
      eyebrow="Join fomo"
      title={
        screenStep === 'identifier'
          ? 'Create your account'
          : screenStep === 'verify'
            ? 'Verify your email'
            : screenStep === 'password'
              ? 'Create your password'
              : 'Create your username'
      }
      subtitle={
        screenStep === 'identifier'
          ? 'Start with Google or email, then we will guide you through the rest.'
          : screenStep === 'verify'
            ? 'We already sent your code, so you can finish verifying this email now.'
            : screenStep === 'password'
              ? 'Your email is verified. Next, set the password for this account.'
              : 'Pick the name people will use to find you on fomo.'
      }
      footer={{
        prompt: 'Already have an account?',
        link: {
          label: 'Log in',
          href: '/(auth)/login',
        },
      }}
    >
      <AuthErrorBanner message={state.errors?.global} />
      {screenStep === 'identifier' ? (
        <IdentifierStep
          mode="signup"
          value={state.emailAddress}
          placeholder="you@example.com"
          buttonLabel="Continue with email"
          dividerLabel="or sign up with email"
          isBusy={state.isBusy}
          isGoogleLoading={loadingProvider === 'google'}
          isGoogleDisabled={loadingProvider !== null}
          isPrimaryLoading={state.isSendingCode}
          error={state.errors?.email}
          onChangeText={setEmailAddress}
          onPrimaryPress={onStartEmailSignUp}
          onGooglePress={() => signInWith('google')}
        />
      ) : screenStep === 'verify' ? (
        <VerificationStep
          value={state.code}
          onChangeText={setCode}
          onSubmit={onVerifyPress}
          onResend={onResendPress}
          resendAvailableAt={state.resendAvailableAt}
          isResending={state.isResending}
          isSubmitting={state.isVerifying}
          submitLabel="Verify email"
          submitLoadingLabel="Verifying..."
          error={state.errors?.code}
        />
      ) : screenStep === 'password' ? (
        <PasswordStep
          label="Create password"
          value={state.password}
          placeholder="Choose a secure password"
          submitLabel="Continue"
          submitLoadingLabel="Saving password..."
          error={state.errors?.password}
          isSubmitting={state.isSubmittingPassword}
          isDisabled={state.isBusy}
          onChangeText={setPassword}
          onSubmit={onPasswordPress}
        />
      ) : (
        <UsernameStep
          emailAddress={pendingUsernameSetup?.emailAddress ?? state.emailAddress}
          username={state.username}
          usernameError={state.errors?.username}
          isSubmitting={state.isSubmittingUsername || isCompletingUsername}
          avatarUri={state.avatarUri}
          onChangeUsername={setUsername}
          onSubmit={() => {
            if (state.avatarUri) {
              // console.log('[signup] storing pending avatar before completion:', state.avatarUri);
              setPendingSignupAvatar(state.avatarUri, avatarFileNameParam ?? null);
            }
            void (pendingUsernameSetup
              ? completeSignUpWithUsername(state.username)
              : completeEmailSignUpWithUsername(state.username));
          }}
        />
      )}
    </AuthWrapper>
  );
}
