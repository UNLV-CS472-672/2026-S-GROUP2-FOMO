import { AppHeaderBackButton } from '@/components/navigation/header-back-button';
import { AuthErrorBanner } from '@/features/auth/components/error';
import { IdentifierStep } from '@/features/auth/components/steps/identifier';
import { PasswordStep } from '@/features/auth/components/steps/password';
import { VerificationStep } from '@/features/auth/components/steps/verification';
import { AuthWrapper } from '@/features/auth/components/wrapper';
import { useGoogleSignIn } from '@/features/auth/hooks/use-google-sign-in';
import { useLogin } from '@/features/auth/hooks/use-login';
import { useAppTheme } from '@/lib/use-app-theme';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export default function LoginScreen() {
  const theme = useAppTheme();
  const {
    state,
    shouldShowAuthLoader,
    authLoadingMessage,
    setIdentifier,
    setPassword,
    setCode,
    clearErrors,
    handleSsoError,
    continueWithIdentifier,
    switchChallengeMethod,
    goBack,
    onResendCodePress,
    onVerifyCodePress,
    onPasswordSignInPress,
  } = useLogin();
  const { loadingProvider, signInWith } = useGoogleSignIn({
    clearErrors,
    handleError: handleSsoError,
    intent: 'signin',
  });
  const navigation = useNavigation();
  const usingPassword = state.challengeMethod === 'password';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        state.step === 'challenge' ? (
          <AppHeaderBackButton onPress={goBack} />
        ) : (
          <AppHeaderBackButton />
        ),
    });
  }, [goBack, navigation, state.step]);

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
      eyebrow="Welcome back"
      title={state.step === 'identifier' ? 'Log in to fomo' : 'Finish signing in'}
      footer={{
        prompt: "Don't have an account?",
        link: {
          label: 'Sign up',
          href: '/(auth)/signup',
        },
      }}
    >
      <AuthErrorBanner message={state.errors?.global} />
      {state.step === 'identifier' ? (
        <IdentifierStep
          mode="login"
          value={state.identifier}
          placeholder="you@example.com or cooluser123"
          buttonLabel="Continue"
          dividerLabel="or continue with"
          isBusy={state.isBusy}
          isGoogleLoading={loadingProvider === 'google'}
          isGoogleDisabled={loadingProvider !== null}
          isPrimaryLoading={state.isSendingCode}
          error={state.errors?.identifier}
          onChangeText={setIdentifier}
          onPrimaryPress={continueWithIdentifier}
          onGooglePress={() => signInWith('google')}
        />
      ) : (
        <>
          <View className="rounded-2xl bg-muted-foreground/8 p-1.5">
            <View className="flex-row gap-2">
              <Pressable
                className={`flex-1 rounded-2xl px-4 py-3 ${
                  !usingPassword ? 'bg-background' : 'bg-transparent'
                }`}
                onPress={() => void switchChallengeMethod('email_code')}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    !usingPassword ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Email code
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 rounded-2xl px-4 py-3 ${
                  usingPassword ? 'bg-background' : 'bg-transparent'
                }`}
                onPress={() => void switchChallengeMethod('password')}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    usingPassword ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Password
                </Text>
              </Pressable>
            </View>
          </View>

          {usingPassword ? (
            <PasswordStep
              label="Password"
              value={state.password}
              placeholder="Enter your password"
              submitLabel="Log in with password"
              submitLoadingLabel="Logging in..."
              error={state.errors?.password}
              isSubmitting={state.isSigningInWithPassword}
              isDisabled={state.isBusy || loadingProvider !== null}
              onChangeText={setPassword}
              onSubmit={onPasswordSignInPress}
            />
          ) : (
            <VerificationStep
              value={state.code}
              onChangeText={setCode}
              onSubmit={onVerifyCodePress}
              onResend={onResendCodePress}
              resendAvailableAt={state.resendAvailableAt}
              isResending={state.isResendingCode}
              isSubmitting={state.isVerifyingCode}
              submitLabel="Log in"
              submitLoadingLabel="Verifying..."
              error={state.errors?.code}
            />
          )}
        </>
      )}
    </AuthWrapper>
  );
}
