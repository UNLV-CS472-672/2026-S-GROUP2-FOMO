import { Screen } from '@/components/ui/screen';
import { useAppTheme } from '@/lib/use-app-theme';
import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, Text, View } from 'react-native';
import googleGLogo from '../../../../../../../../assets/auth/google/g-logo.png';

function ProviderIcon({ provider }: { provider: string }) {
  const theme = useAppTheme();

  if (provider.includes('apple')) {
    return <Ionicons name="logo-apple" size={26} color={theme.text} />;
  }

  if (provider.includes('google')) {
    return <Image source={googleGLogo} style={{ width: 26, height: 26 }} resizeMode="contain" />;
  }

  return <Ionicons name="link-outline" size={18} color={theme.tint} />;
}

function Row({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
      <View className="w-6 items-center">{icon}</View>
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-medium text-foreground">{title}</Text>
        <Text className="text-sm text-muted-foreground">{subtitle}</Text>
      </View>
    </View>
  );
}

export default function ConnectedAccountsScreen() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <Screen className="items-center justify-center">
        <Text className="text-muted-foreground">Loading connected accounts...</Text>
      </Screen>
    );
  }

  const externalAccounts = user?.externalAccounts ?? [];
  const emailAddresses = user?.emailAddresses ?? [];

  return (
    <Screen>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="p-6 gap-6"
      >
        <View className="gap-2">
          <Text className="text-sm text-muted-foreground">
            Review the sign-in methods currently attached to your Fomo account.
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold uppercase tracking-[1.5px] text-muted-foreground">
            Email Addresses
          </Text>
          {emailAddresses.length > 0 ? (
            emailAddresses.map((emailAddress) => (
              <Row
                key={emailAddress.id}
                icon={<Ionicons name="mail-outline" size={18} color="#8a8a8a" />}
                title={emailAddress.emailAddress}
                subtitle={
                  emailAddress.verification?.status === 'verified' ? 'Verified' : 'Unverified'
                }
              />
            ))
          ) : (
            <Text className="text-sm text-muted-foreground">No email addresses connected.</Text>
          )}
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold uppercase tracking-[1.5px] text-muted-foreground">
            Social Accounts
          </Text>
          {externalAccounts.length > 0 ? (
            externalAccounts.map((account) => {
              const provider = account.provider ?? 'Connected account';
              const identifier = account.emailAddress || account.username || 'Connected';
              const providerLabel = provider.includes('google')
                ? 'Google'
                : provider.includes('apple')
                  ? 'Apple'
                  : provider
                      .replace(/^oauth_/, '')
                      .split('_')
                      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(' ');

              return (
                <Row
                  key={account.id}
                  icon={<ProviderIcon provider={provider} />}
                  title={providerLabel}
                  subtitle={identifier}
                />
              );
            })
          ) : (
            <Text className="text-sm text-muted-foreground">No social accounts connected yet.</Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
