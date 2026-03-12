import { Button, ButtonText } from '@/components/ui/button';
import { SocialButton } from '@/features/auth/components/social-button';
import { useSignup } from '@/features/auth/hooks/use-signup';
import { useSso } from '@/features/auth/hooks/use-sso';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function Page() {
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
    onSignUpPress,
    onVerifyPress,
    onResendPress,
  } = useSignup();
  const {
    loadingProvider,
    signInWith,
    pendingUsernameSetup,
    isCompletingUsername,
    completeSignUpWithUsername,
  } = useSso({
    clearErrors,
    handleError: handleSsoError,
    mode: 'signup',
  });

  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
          {state.pendingVerification ? (
            <View className="w-full">
              <Text className="text-3xl font-bold text-app-text">Verify your email</Text>

              <Text className="mt-2 text-base text-app-icon">
                We sent a verification code to {state.emailAddress || 'your email address'}.
              </Text>

              {state.codeSentMessage ? (
                <Text className="mt-1 text-sm text-app-text">{state.codeSentMessage}</Text>
              ) : null}

              {state.errors?.global ? (
                <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
                  <Text className="text-sm font-medium text-red-800">{state.errors.global}</Text>
                </View>
              ) : null}

              <View className="mt-6">
                <Text className="text-sm font-semibold text-app-text">Verification code</Text>
                <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    value={state.code}
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
                {state.errors?.code ? (
                  <Text className="mt-1 text-xs text-red-600">{state.errors.code}</Text>
                ) : null}
              </View>

              <View className="mt-4 flex-row items-center justify-between">
                <Pressable onPress={onResendPress} disabled={state.isResending}>
                  <Text
                    className={
                      state.isResending
                        ? 'text-sm text-app-icon'
                        : 'text-sm font-semibold text-app-tint'
                    }
                  >
                    {state.isResending ? 'Resending code...' : 'Resend code'}
                  </Text>
                </Pressable>

                {state.isResending ? <ActivityIndicator size="small" color="#4B5563" /> : null}
              </View>

              <View className="mt-6">
                <Button onPress={onVerifyPress} disabled={!state.code || state.isVerifying}>
                  <ButtonText>{state.isVerifying ? 'Verifying...' : 'Verify'}</ButtonText>
                </Button>
              </View>
            </View>
          ) : pendingUsernameSetup ? (
            <View className="w-full">
              <Text className="text-3xl font-bold text-app-text">Choose a username</Text>
              <Text className="mt-2 text-base text-app-icon">
                One last step before we finish creating your account.
              </Text>

              {state.errors?.global ? (
                <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
                  <Text className="text-sm font-medium text-red-800">{state.errors.global}</Text>
                </View>
              ) : null}

              <View className="mt-8">
                <Text className="text-sm font-semibold text-app-text">Username</Text>
                <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    autoCapitalize="none"
                    value={state.username}
                    placeholder="cooluser123"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={setUsername}
                    className="py-3 text-base text-app-text"
                    returnKeyType="done"
                    onSubmitEditing={() => completeSignUpWithUsername(state.username)}
                  />
                </View>
                {state.errors?.username ? (
                  <Text className="mt-1 text-xs text-red-600">{state.errors.username}</Text>
                ) : null}
              </View>

              <View className="mt-6">
                <Button
                  onPress={() => completeSignUpWithUsername(state.username)}
                  disabled={!state.username.trim() || isCompletingUsername}
                >
                  <ButtonText>
                    {isCompletingUsername ? 'Finishing account setup...' : 'Continue'}
                  </ButtonText>
                </Button>
              </View>
            </View>
          ) : (
            <View className="w-full">
              <Text className="text-3xl font-bold text-app-text">Create your account</Text>

              {state.errors?.global ? (
                <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
                  <Text className="text-sm font-medium text-red-800">{state.errors.global}</Text>
                </View>
              ) : null}

              <View className="mt-8">
                <SocialButton
                  mode="signup"
                  onPress={() => signInWith('google')}
                  loading={loadingProvider === 'google'}
                  disabled={loadingProvider !== null || state.isSubmitting}
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
                    value={state.username}
                    placeholder="cooluser123"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={setUsername}
                    className="py-3 text-base text-app-text"
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                  />
                </View>
                {state.errors?.username ? (
                  <Text className="mt-1 text-xs text-red-600">{state.errors.username}</Text>
                ) : null}
              </View>

              <View className="mt-4">
                <Text className="text-sm font-semibold text-app-text">Email address</Text>
                <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    ref={emailInputRef}
                    autoCapitalize="none"
                    value={state.emailAddress}
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={setEmailAddress}
                    keyboardType="email-address"
                    className="py-3 text-base text-app-text"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
                {state.errors?.email ? (
                  <Text className="mt-1 text-xs text-red-600">{state.errors.email}</Text>
                ) : null}
              </View>

              <View className="mt-4">
                <Text className="text-sm font-semibold text-app-text">Password</Text>
                <View className="mt-2 flex-row items-center rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    ref={passwordInputRef}
                    value={state.password}
                    placeholder="Enter a password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    onChangeText={setPassword}
                    className="flex-1 py-3 text-base text-app-text"
                    returnKeyType="done"
                    onSubmitEditing={onSignUpPress}
                  />
                  <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                  </Pressable>
                </View>
                {state.errors?.password ? (
                  <Text className="mt-1 text-xs text-red-600">{state.errors.password}</Text>
                ) : null}
              </View>

              <View className="mt-6">
                <Button
                  onPress={onSignUpPress}
                  disabled={
                    !state.username.trim() ||
                    !state.emailAddress.trim() ||
                    !state.password ||
                    state.isSubmitting
                  }
                >
                  <ButtonText>{state.isSubmitting ? 'Creating account...' : 'Continue'}</ButtonText>
                </Button>
              </View>

              {state.isSubmitting ? (
                <View className="mt-2 items-center">
                  <ActivityIndicator size="small" color="#4B5563" />
                </View>
              ) : null}

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
