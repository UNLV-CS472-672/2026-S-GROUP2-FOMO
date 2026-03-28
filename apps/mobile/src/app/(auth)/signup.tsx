import { AuthErrorBanner } from '@/features/auth/components/error';
import { AuthHeaderBackButton } from '@/features/auth/components/header-back-button';
import { IdentifierStep } from '@/features/auth/components/steps/identifier';
import { PasswordStep } from '@/features/auth/components/steps/password';
import { UsernameStep } from '@/features/auth/components/steps/username';
import { VerificationStep } from '@/features/auth/components/steps/verification';
import { AuthWrapper } from '@/features/auth/components/wrapper';
import { useGoogleSignIn } from '@/features/auth/hooks/use-google-sign-in';
import { useSignup } from '@/features/auth/hooks/use-signup';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function SignUpScreen() {
  const {
    state,
    shouldShowAuthLoader,
    authLoadingMessage,
    setUsername,
    setEmailAddress,
    setPassword,
    setCode,
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
  const isGoogleUsernameStep = Boolean(pendingUsernameSetup);
  const screenStep = isGoogleUsernameStep ? 'username' : state.step;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        screenStep !== 'identifier' && !pendingUsernameSetup ? (
          <AuthHeaderBackButton onPress={goBack} />
        ) : (
          <AuthHeaderBackButton />
        ),
    });
  }, [goBack, navigation, pendingUsernameSetup, screenStep]);

  if (shouldShowAuthLoader) {
    return (
      <View className="flex-1 items-center justify-center bg-app-background px-8">
        <ActivityIndicator size="large" color="#4B5563" />
        <Text className="mt-3 text-sm text-app-icon">{authLoadingMessage}</Text>
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
          onChangeUsername={setUsername}
          onSubmit={() =>
            pendingUsernameSetup
              ? completeSignUpWithUsername(state.username)
              : completeEmailSignUpWithUsername(state.username)
          }
        />
      )}
    </AuthWrapper>
  );
}
