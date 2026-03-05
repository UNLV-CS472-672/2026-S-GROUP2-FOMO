import { SocialButton } from '@/components/auth/social-button';
import { Button, ButtonText } from '@/components/ui/button';
import { isClerkAPIResponseError, useAuth, useSignUp, useSSO } from '@clerk/clerk-expo';
import type { ClerkAPIError } from '@clerk/types';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
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

type SignUpErrorsState = {
  username?: string;
  email?: string;
  password?: string;
  code?: string;
  global?: string;
};

const RESEND_COOLDOWN_SECONDS = 30;

export default function Page() {
  const { isSignedIn } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [username, setUsername] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<SignUpErrorsState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeSentMessage, setCodeSentMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleClerkError = (err: unknown, context: 'signup' | 'verify' | 'resend') => {
    if (isClerkAPIResponseError(err)) {
      const apiErrors = (err.errors || []) as ClerkAPIError[];
      const nextErrors: SignUpErrorsState = {};

      apiErrors.forEach((error) => {
        const meta = (error.meta || {}) as { paramName?: string };
        const paramName = meta.paramName;
        const message = error.longMessage || error.message;

        if (paramName === 'username') {
          nextErrors.username = message;
        } else if (paramName === 'email_address') {
          nextErrors.email = message;
        } else if (paramName === 'password') {
          nextErrors.password = message;
        } else if (paramName === 'code') {
          nextErrors.code = message;
        } else if (context === 'verify' && !paramName) {
          nextErrors.code = message || 'Verification failed. Please try again.';
        } else {
          nextErrors.global = message;
        }
      });

      setErrors(nextErrors);
    } else {
      setErrors({
        global: 'Something went wrong. Please try again.',
      });
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);

    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current);
    }

    const intervalId = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    resendIntervalRef.current = intervalId;
  };

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }
    };
  }, []);

  const signUpWithGoogle = async () => {
    if (isSignedIn || loadingGoogle) return;

    setLoadingGoogle(true);
    setErrors(null);

    try {
      const redirectUrl = Linking.createURL('/', { scheme: 'mobile' });

      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      if (createdSessionId) {
        await ssoSetActive?.({ session: createdSessionId });
      }
    } catch (err) {
      handleClerkError(err, 'signup');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (isSignedIn) return;

    setErrors(null);
    setIsSubmitting(true);

    try {
      await signUp.create({
        username,
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
      setCodeSentMessage('We sent a verification code to your email address.');
      startResendCooldown();
    } catch (err) {
      handleClerkError(err, 'signup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    if (isSignedIn) return;

    setErrors(null);
    setIsVerifying(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({
          session: signUpAttempt.createdSessionId,
        });
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      handleClerkError(err, 'verify');
    } finally {
      setIsVerifying(false);
    }
  };

  const onResendPress = async () => {
    if (!isLoaded) return;
    if (isSignedIn) return;
    if (resendCooldown > 0 || isResending) return;

    setErrors(null);
    setIsResending(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setCodeSentMessage('Verification code resent.');
      startResendCooldown();
    } catch (err) {
      handleClerkError(err, 'resend');
    } finally {
      setIsResending(false);
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
          {pendingVerification ? (
            <View className="w-full">
              <Text className="text-3xl font-bold text-app-text">Verify your email</Text>

              <Text className="mt-2 text-base text-app-icon">
                We sent a verification code to {emailAddress || 'your email address'}.
              </Text>

              {codeSentMessage && (
                <Text className="mt-1 text-sm text-app-text">{codeSentMessage}</Text>
              )}

              {errors?.global && (
                <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
                  <Text className="text-sm font-medium text-red-800">{errors.global}</Text>
                </View>
              )}

              <View className="mt-6">
                <Text className="text-sm font-semibold text-app-text">Verification code</Text>
                <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    value={code}
                    placeholder="Enter your verification code"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={setCode}
                    keyboardType="numeric"
                    className="py-3 text-base text-app-text"
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={onVerifyPress}
                  />
                </View>
                {errors?.code && <Text className="mt-1 text-xs text-red-600">{errors.code}</Text>}
              </View>

              <View className="mt-4 flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={onResendPress}
                  disabled={resendCooldown > 0 || isResending}
                >
                  <Text
                    className={
                      resendCooldown > 0 || isResending
                        ? 'text-sm text-app-icon'
                        : 'text-sm font-semibold text-app-tint'
                    }
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </Text>
                </TouchableOpacity>

                {isResending && <ActivityIndicator size="small" color="#4B5563" />}
              </View>

              <View className="mt-6">
                <Button onPress={onVerifyPress} disabled={!code || isVerifying}>
                  <ButtonText>{isVerifying ? 'Verifying...' : 'Verify'}</ButtonText>
                </Button>
              </View>
            </View>
          ) : (
            <View className="w-full">
              <Text className="text-3xl font-bold text-app-text">Create your account</Text>

              {errors?.global && (
                <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
                  <Text className="text-sm font-medium text-red-800">{errors.global}</Text>
                </View>
              )}

              <View className="mt-8">
                <SocialButton
                  mode="signup"
                  onPress={signUpWithGoogle}
                  loading={loadingGoogle}
                  disabled={loadingGoogle || isSubmitting}
                />
              </View>

              <View className="my-6 flex-row items-center gap-4">
                <View className="flex-1 border-b border-app-icon/20" />
                <Text className="text-sm text-app-icon">or</Text>
                <View className="flex-1 border-b border-app-icon/20" />
              </View>

              <View>
                <Text className="text-sm font-semibold text-app-text">Username</Text>
                <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    autoCapitalize="none"
                    value={username}
                    placeholder="cooluser123"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={setUsername}
                    className="py-3 text-base text-app-text"
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                  />
                </View>
                {errors?.username && (
                  <Text className="mt-1 text-xs text-red-600">{errors.username}</Text>
                )}
              </View>

              <View className="mt-4">
                <Text className="text-sm font-semibold text-app-text">Email address</Text>
                <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    ref={emailInputRef}
                    autoCapitalize="none"
                    value={emailAddress}
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={setEmailAddress}
                    keyboardType="email-address"
                    className="py-3 text-base text-app-text"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
                {errors?.email && <Text className="mt-1 text-xs text-red-600">{errors.email}</Text>}
              </View>

              <View className="mt-4">
                <Text className="text-sm font-semibold text-app-text">Password</Text>
                <View className="mt-2 flex-row items-center rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    ref={passwordInputRef}
                    value={password}
                    placeholder="Enter a password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    onChangeText={setPassword}
                    className="flex-1 py-3 text-base text-app-text"
                    returnKeyType="done"
                    onSubmitEditing={onSignUpPress}
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
                <Button
                  onPress={onSignUpPress}
                  disabled={!username || !emailAddress || !password || isSubmitting}
                >
                  <ButtonText>{isSubmitting ? 'Creating account...' : 'Continue'}</ButtonText>
                </Button>
              </View>

              {isSubmitting && (
                <View className="mt-2 items-center">
                  <ActivityIndicator size="small" color="#4B5563" />
                </View>
              )}

              <View className="mt-8 flex-row justify-center">
                <Text className="text-base text-app-text">Have an account? </Text>
                <Link href="/(auth)/login">
                  <Text className="text-base font-semibold text-app-tint">Log in</Text>
                </Link>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
