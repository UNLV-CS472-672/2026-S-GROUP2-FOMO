import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type AuthWrapperProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: {
    prompt: string;
    link: {
      label: string;
      href: '/(auth)/login' | '/(auth)/signup';
    };
  };
};

export function AuthWrapper({ eyebrow, title, subtitle, children, footer }: AuthWrapperProps) {
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-app-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 bg-app-background">
          <ScrollView
            className="flex-1"
            contentContainerClassName="flex-grow justify-center px-8 py-10"
            keyboardShouldPersistTaps="handled"
          >
            {eyebrow ? (
              <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-app-tint">
                {eyebrow}
              </Text>
            ) : null}

            <Text className="mt-3 text-3xl font-bold leading-9 text-app-text">{title}</Text>

            {subtitle ? (
              <Text className="mt-2 text-base leading-6 text-app-icon">{subtitle}</Text>
            ) : null}

            <View className="mt-6 gap-5">{children}</View>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-base text-app-text">{footer.prompt} </Text>
              <Link href={footer.link.href}>
                <Text className="text-base font-semibold text-app-tint">{footer.link.label}</Text>
              </Link>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
