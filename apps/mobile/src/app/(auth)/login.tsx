import { Button, ButtonText } from '@/components/ui/button';
import { GoogleButton } from '@/features/auth/components/google-button';
import { VerificationCodeInput } from '@/features/auth/components/verification-code-input';
import { useGoogleSignIn } from '@/features/auth/hooks/use-google-sign-in';
import { useLogin } from '@/features/auth/hooks/use-login';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
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

export default function LoginScreen() {
  const {
    state,
    shouldShowAuthLoader,
    authLoadingMessage,
    setAuthMethod,
    setIdentifier,
    setPassword,
    setCode,
    clearErrors,
    handleSsoError,
    onSignInPress,
    onSendCodePress,
    onVerifyCodePress,
  } = useLogin();
  const { loadingProvider, signInWith } = useGoogleSignIn({
    clearErrors,
    handleError: handleSsoError,
    intent: 'signin',
  });

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
          <Text className="text-3xl font-bold text-app-text">
            Log in to <Text className="font-heading font-black text-4xl">fomo</Text>
          </Text>

          {state.errors?.global ? (
            <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-sm font-medium text-red-800">{state.errors.global}</Text>
            </View>
          ) : null}

          <View className="mt-8">
            <GoogleButton
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

          <View className="mb-4 flex-row rounded-full bg-app-icon/10 p-1">
            <Pressable
              className={`flex-1 rounded-full py-2 ${
                state.authMethod === 'password' ? 'bg-app-text' : ''
              }`}
              onPress={() => setAuthMethod('password')}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  state.authMethod === 'password' ? 'text-app-background' : 'text-app-text'
                }`}
              >
                Password
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 rounded-full py-2 ${
                state.authMethod === 'email_code' ? 'bg-app-text' : ''
              }`}
              onPress={() => setAuthMethod('email_code')}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  state.authMethod === 'email_code' ? 'text-app-background' : 'text-app-text'
                }`}
              >
                Email code
              </Text>
            </Pressable>
          </View>

          <View>
            <Text className="text-sm font-semibold text-app-text">Email or username</Text>
            <View className="mt-2 rounded-xl border border-app-icon/30 bg-app-background px-4">
              <TextInput
                autoCapitalize="none"
                value={state.identifier}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                onChangeText={setIdentifier}
                keyboardType="email-address"
                className="py-3 text-base text-app-text"
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (state.authMethod === 'password') {
                    passwordInputRef.current?.focus();
                  }
                }}
              />
            </View>
            {state.errors?.identifier ? (
              <Text className="mt-1 text-xs text-red-600">{state.errors.identifier}</Text>
            ) : null}
          </View>

          {state.authMethod === 'password' ? (
            <>
              <View className="mt-4">
                <Text className="text-sm font-semibold text-app-text">Password</Text>
                <View className="mt-2 flex-row items-center rounded-xl border border-app-icon/30 bg-app-background px-4">
                  <TextInput
                    ref={passwordInputRef}
                    value={state.password}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    onChangeText={setPassword}
                    className="flex-1 py-3 text-base text-app-text"
                    returnKeyType="done"
                    onSubmitEditing={onSignInPress}
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
                  onPress={onSignInPress}
                  disabled={!state.identifier.trim() || !state.password || state.isSubmitting}
                >
                  <ButtonText>{state.isSubmitting ? 'Logging in...' : 'Log in'}</ButtonText>
                </Button>
              </View>
            </>
          ) : (
            <>
              {state.isCodeSent ? (
                <View className="mt-4">
                  <Text className="text-sm font-semibold text-app-text">Verification code</Text>
                  <VerificationCodeInput
                    value={state.code}
                    onChangeText={setCode}
                    onSubmitEditing={onVerifyCodePress}
                  />
                  {state.errors?.code ? (
                    <Text className="mt-1 text-xs text-red-600">{state.errors.code}</Text>
                  ) : null}
                </View>
              ) : null}

              <View className="mt-6 flex-row gap-3">
                <View className="flex-1">
                  <Button
                    variant="secondary"
                    onPress={onSendCodePress}
                    disabled={!state.identifier.trim() || state.isSubmitting || state.isCodeSent}
                    className="inline-flex flex-row gap-2"
                  >
                    {state.isSubmitting ? (
                      <View className="mt-2 items-center">
                        <ActivityIndicator size={10} color="#4B5563" />
                      </View>
                    ) : null}
                    <ButtonText variant="secondary">
                      {state.isCodeSent ? 'Code sent' : 'Send code'}
                    </ButtonText>
                  </Button>
                </View>
                {state.isCodeSent ? (
                  <View className="flex-1">
                    <Button
                      onPress={onVerifyCodePress}
                      disabled={!state.code || state.isSubmitting}
                    >
                      <ButtonText>
                        {state.isSubmitting ? 'Verifying...' : 'Log in with code'}
                      </ButtonText>
                    </Button>
                  </View>
                ) : null}
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
