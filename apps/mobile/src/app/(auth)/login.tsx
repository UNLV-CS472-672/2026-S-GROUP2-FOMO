import { SocialButton } from '@/components/auth/social-button';
import { Button, ButtonText } from '@/components/ui/button';
import { isClerkAPIResponseError, useAuth, useSignIn, useSSO } from '@clerk/clerk-expo';
import type { ClerkAPIError } from '@clerk/types';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

type SignInErrorsState = {
  identifier?: string;
  password?: string;
  code?: string;
  global?: string;
};

export default function LoginScreen() {
  const { isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [loadingProvider, setLoadingProvider] = useState<'google' | null>(null);
  const [authMethod, setAuthMethod] = useState<'password' | 'email_code'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [errors, setErrors] = useState<SignInErrorsState | null>(null);

  const passwordInputRef = useRef<TextInput | null>(null);

  const handleClerkError = (err: unknown) => {
    if (isClerkAPIResponseError(err)) {
      const apiErrors = (err.errors || []) as ClerkAPIError[];
      const nextErrors: SignInErrorsState = {};

      apiErrors.forEach((error) => {
        const meta = (error.meta || {}) as { paramName?: string };
        const paramName = meta.paramName;
        const message = error.longMessage || error.message;

        if (paramName === 'identifier') {
          nextErrors.identifier = message;
        } else if (paramName === 'password') {
          nextErrors.password = message;
        } else if (paramName === 'code') {
          nextErrors.code = message;
        } else {
          nextErrors.global = message;
        }
      });

      setErrors(nextErrors);
    } else {
      setErrors({ global: 'Something went wrong. Please try again.' });
    }
  };

  const signInWith = async (provider: 'google') => {
    if (isSignedIn || loadingProvider) return;

    setLoadingProvider(provider);
    setErrors(null);

    try {
      const redirectUrl = Linking.createURL('/', { scheme: 'mobile' });

      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: `oauth_${provider}`,
        redirectUrl,
      });

      if (createdSessionId) {
        await ssoSetActive?.({ session: createdSessionId });
      }
    } catch (err) {
      handleClerkError(err);
    } finally {
      setLoadingProvider(null);
    }
  };

  const onSignInPress = async () => {
    if (authMethod !== 'password') return;

    if (!isLoaded || isSignedIn) return;

    setErrors(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err) {
      handleClerkError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSendCodePress = async () => {
    if (!isLoaded || isSignedIn || !identifier) return;

    setErrors(null);
    setIsSubmitting(true);

    try {
      await signIn.create({
        identifier,
      });

      const emailFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      if (!emailFactor || !('emailAddressId' in emailFactor) || !emailFactor.emailAddressId) {
        setErrors({
          global: 'Email code sign-in is not available for this account.',
        });
        setIsSubmitting(false);
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setIsCodeSent(true);
    } catch (err) {
      handleClerkError(err);
      setIsCodeSent(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyCodePress = async () => {
    if (!isLoaded || isSignedIn || !code) return;

    setErrors(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err) {
      handleClerkError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowAuthLoader = !isLoaded || isSignedIn;
  const authLoadingMessage = isSignedIn ? 'Finishing sign in...' : 'Loading authentication...';

  if (shouldShowAuthLoader) {
    return (
      <View className="flex-1 items-center justify-center bg-app-background px-8">
        <ActivityIndicator size="large" color="#4B5563" />
        <Text className="mt-3 text-sm text-app-icon">{authLoadingMessage}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-app-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 justify-center px-8">
          <Text className="text-3xl font-bold text-app-text">
            Log in to <Text className="font-heading font-black text-4xl">fomo</Text>
          </Text>

          {errors?.global && (
            <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-sm font-medium text-red-800">{errors.global}</Text>
            </View>
          )}

          <View className="mt-8">
            <SocialButton
              onPress={() => signInWith('google')}
              loading={loadingProvider === 'google'}
              disabled={loadingProvider !== null || isSubmitting}
            />
          </View>

          <View className="my-6 flex-row items-center gap-4">
            <View className="flex-1 border-b border-app-icon/20" />
            <Text className="text-sm text-app-icon">or</Text>
            <View className="flex-1 border-b border-app-icon/20" />
          </View>

          <View className="mb-4 flex-row rounded-full bg-app-icon/10 p-1">
            <TouchableOpacity
              className={`flex-1 rounded-full py-2 ${
                authMethod === 'password' ? 'bg-app-text' : ''
              }`}
              onPress={() => {
                setAuthMethod('password');
                setErrors(null);
                setCode('');
                setIsCodeSent(false);
              }}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  authMethod === 'password' ? 'text-app-background' : 'text-app-text'
                }`}
              >
                Password
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-full py-2 ${
                authMethod === 'email_code' ? 'bg-app-text' : ''
              }`}
              onPress={() => {
                setAuthMethod('email_code');
                setErrors(null);
                setPassword('');
              }}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  authMethod === 'email_code' ? 'text-app-background' : 'text-app-text'
                }`}
              >
                Email code
              </Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text className="text-sm font-semibold text-app-text">Email or username</Text>
            <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
              <TextInput
                autoCapitalize="none"
                value={identifier}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                onChangeText={(text) => {
                  setIdentifier(text);
                  setErrors(null);
                  setIsCodeSent(false);
                }}
                keyboardType="email-address"
                className="py-3 text-base text-app-text"
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (authMethod === 'password') {
                    passwordInputRef.current?.focus();
                  }
                }}
              />
            </View>
            {errors?.identifier && (
              <Text className="mt-1 text-xs text-red-600">{errors.identifier}</Text>
            )}
          </View>

          {authMethod === 'password' ? (
            <>
              <View className="mt-4">
                <Text className="text-sm font-semibold text-app-text">Password</Text>
                <View className="mt-2 flex-row items-center rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    ref={passwordInputRef}
                    value={password}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    onChangeText={setPassword}
                    className="flex-1 py-3 text-base text-app-text"
                    returnKeyType="done"
                    onSubmitEditing={onSignInPress}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                {errors?.password && (
                  <Text className="mt-1 text-xs text-red-600">{errors.password}</Text>
                )}
              </View>

              <View className="mt-6">
                <Button onPress={onSignInPress} disabled={!identifier || !password || isSubmitting}>
                  <ButtonText>{isSubmitting ? 'Logging in...' : 'Log in'}</ButtonText>
                </Button>
              </View>
            </>
          ) : (
            <>
              <View className="mt-4">
                <Text className="text-sm font-semibold text-app-text">Verification code</Text>
                <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    value={code}
                    placeholder="Enter the 6-digit code"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    onChangeText={setCode}
                    className="py-3 text-base text-app-text"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={onVerifyCodePress}
                  />
                </View>
                {errors?.code && <Text className="mt-1 text-xs text-red-600">{errors.code}</Text>}
              </View>

              <View className="mt-6 flex-row gap-3">
                <View className="flex-1">
                  <Button
                    variant="secondary"
                    onPress={onSendCodePress}
                    disabled={!identifier || isSubmitting || isCodeSent}
                    className="inline-flex flex-row gap-2"
                  >
                    {isSubmitting && (
                      <View className="mt-2 items-center">
                        <ActivityIndicator size={10} color="#4B5563" />
                      </View>
                    )}
                    <ButtonText variant="secondary">
                      {isCodeSent ? 'Code sent' : 'Send code'}
                    </ButtonText>
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    onPress={onVerifyCodePress}
                    disabled={!code || !isCodeSent || isSubmitting}
                  >
                    <ButtonText>{isSubmitting ? 'Verifying...' : 'Log in with code'}</ButtonText>
                  </Button>
                </View>
              </View>
            </>
          )}

          <View className="mt-8 flex-row justify-center">
            <Text className="text-base text-app-text">{`Don't have an account? `}</Text>

            <Link href="/(auth)/signup">
              <Text className="text-base font-semibold text-app-tint">Sign up</Text>
            </Link>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
