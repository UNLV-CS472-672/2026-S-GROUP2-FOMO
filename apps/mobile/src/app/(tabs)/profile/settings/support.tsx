import { Button, ButtonText } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AuthInput } from '@/features/auth/components/input';
import { useAppTheme } from '@/lib/use-app-theme';
import { useUser } from '@clerk/expo';
import { api } from '@fomo/backend/convex/_generated/api';
import { useMutation } from 'convex/react';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

const PRIVACY_URL = 'https://fomo-app.dev/privacy';

export default function SupportScreen() {
  const theme = useAppTheme();
  const { user } = useUser();
  const createSupportRequest = useMutation(api.support.createSupportRequest);
  const accountEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? '';

  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!accountEmail) return;
    setEmail(accountEmail);
  }, [accountEmail]);

  const isEmailLocked = Boolean(accountEmail);

  async function handleSubmit() {
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    const trimmedDescription = description.trim();

    if (!trimmedEmail) {
      setErrorMessage('Enter an email so we can follow up.');
      return;
    }

    if (!trimmedDescription) {
      setErrorMessage('Add a short description of the issue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createSupportRequest({
        email: trimmedEmail,
        description: trimmedDescription,
      });
      setDescription('');
      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send your request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <ScrollView
          className="flex-1 bg-background"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="p-6 gap-6 pb-10"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <View className="gap-3 rounded-3xl border border-border bg-card p-5">
            <Text className="text-lg font-semibold text-foreground">
              Tell us what you need help with.
            </Text>
            <Text className="text-sm leading-6 text-muted-foreground">
              Send a quick note and the Fomo team can follow up about account issues, bugs, event
              problems, or anything else you run into.
            </Text>
            <Text className="text-sm leading-6 text-muted-foreground">
              For information about how Fomo handles data, view our{' '}
              <Text
                className="font-medium text-foreground"
                onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}
              >
                privacy policy
              </Text>
              .
            </Text>
          </View>

          <View className="gap-4">
            <AuthInput
              label="Email"
              value={email}
              onChangeText={(value) => {
                if (isEmailLocked) return;
                setEmail(value);
                setErrorMessage('');
                setIsSubmitted(false);
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isEmailLocked}
            />

            {isEmailLocked ? (
              <Text className="-mt-2 text-xs leading-5 text-muted-foreground">
                Support replies will be sent to your account email.
              </Text>
            ) : null}

            <View>
              <Text className="text-sm font-semibold text-foreground">Description</Text>
              <View className="mt-2 rounded-xl border border-muted-foreground/30 bg-background px-4 py-3">
                <TextInput
                  value={description}
                  onChangeText={(value) => {
                    setDescription(value);
                    setErrorMessage('');
                    setIsSubmitted(false);
                  }}
                  placeholder="Describe the issue, question, or feedback you have for Fomo."
                  placeholderTextColor={theme.mutedText}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  className="min-h-32 text-base text-foreground"
                />
              </View>
            </View>

            {errorMessage ? <Text className="text-sm text-destructive">{errorMessage}</Text> : null}

            {isSubmitted ? (
              <Text className="text-sm text-emerald-600 dark:text-emerald-400">
                Your message was sent. We will follow up at the email you provided.
              </Text>
            ) : null}

            <Button size="lg" disabled={isSubmitting} onPress={() => void handleSubmit()}>
              <ButtonText>{isSubmitting ? 'Sending...' : 'Send support request'}</ButtonText>
            </Button>
          </View>
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}
