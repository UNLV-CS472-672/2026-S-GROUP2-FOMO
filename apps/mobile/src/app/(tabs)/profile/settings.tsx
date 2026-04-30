import { Button, ButtonText } from '@/components/ui/button';
import { DrawerModal } from '@/components/ui/drawer';
import { signOutClerkExpo } from '@/features/auth/utils/clerk-sign-out';
import { InterestsPicker } from '@/features/profile/components/interests-picker';
import { useAppTheme } from '@/lib/use-app-theme';
import { useClerk } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';

export default function SettingsScreen() {
  const clerk = useClerk();
  const router = useRouter();
  const theme = useAppTheme();
  const { theme: activeTheme } = useUniwind();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [interestsOpen, setInterestsOpen] = useState(false);

  const isDarkMode = activeTheme === 'dark';

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOutClerkExpo(clerk);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="grow p-6 gap-4"
      >
        <Text className="text-[30px] font-bold leading-8 text-foreground">Settings</Text>
        <Text className="text-base leading-6 text-foreground">
          Notification, privacy, and account preferences go here.
        </Text>

        <View className="rounded-xl bg-card px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-foreground">Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={(value) => Uniwind.setTheme(value ? 'dark' : 'light')}
              accessibilityLabel="Toggle dark mode"
            />
          </View>
        </View>

        <Pressable
          className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5"
          onPress={() => setInterestsOpen(true)}
          accessibilityRole="button"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="pizza" size={20} color={theme.tint} />
            <Text className="text-base font-medium text-foreground">Interests</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.mutedText} />
        </Pressable>

        <Button
          variant="secondary"
          onPress={() => router.push('/(tabs)/profile/edit' as never)}
          accessibilityLabel="Edit profile"
        >
          <ButtonText variant="secondary">Edit Profile</ButtonText>
        </Button>

        <View className="mt-2">
          <Button
            variant="destructive"
            onPress={() => void handleLogout()}
            disabled={isSigningOut}
            accessibilityLabel="Log out"
          >
            <ButtonText variant="destructive">
              {isSigningOut ? 'Logging out...' : 'Log out'}
            </ButtonText>
          </Button>
        </View>
      </ScrollView>

      <DrawerModal
        open={interestsOpen}
        onClose={() => setInterestsOpen(false)}
        snapPoints={['75%']}
        enablePanDownToClose
        backdropAppearsOnIndex={0}
        backdropDisappearsOnIndex={-1}
      >
        <View className="mx-6 mb-4">
          <Text className="text-[17px] font-bold text-foreground">Interests</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Update the tags that describe what you want to see more of.
          </Text>
        </View>
        <BottomSheetScrollView keyboardShouldPersistTaps="handled">
          <InterestsPicker
            variant="sheet"
            title="Interests"
            subtitle=""
            saveLabel="Save interests"
            savingLabel="Saving..."
            successMessage="Your interests have been updated."
            onSaved={() => setInterestsOpen(false)}
          />
        </BottomSheetScrollView>
      </DrawerModal>
    </>
  );
}
