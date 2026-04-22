import { ProfilePage, ProfileStateScreen } from '@/features/profile/profile-page';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

export default function VisitProfileScreen() {
  const router = useRouter();
  const { username: rawUsername } = useLocalSearchParams<{ username?: string | string[] }>();
  const username = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;
  const screenTitle = username ?? 'Profile';

  const profile = useQuery(api.users.getProfileByUsername, username ? { username } : 'skip');

  if (!username) {
    return (
      <>
        <Stack.Screen options={{ title: screenTitle }} />
        <ProfileStateScreen
          message="Profile not found"
          actionLabel="Go Back"
          onPressAction={() => router.back()}
        />
      </>
    );
  }

  if (profile === undefined) {
    return (
      <>
        <Stack.Screen options={{ title: screenTitle }} />
        <ProfileStateScreen message="Loading profile..." />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Stack.Screen options={{ title: screenTitle }} />
        <ProfileStateScreen
          message="Profile not found"
          actionLabel="Go Back"
          onPressAction={() => router.back()}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: screenTitle }} />
      <ProfilePage
        profile={profile}
        secondaryStat={{
          label: 'Events',
          value: profile.stats.eventCount,
        }}
        activityLabel="Recent Events"
        topPaddingClassName="pt-5"
      />
    </>
  );
}
