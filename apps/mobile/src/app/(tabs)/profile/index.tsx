import { Screen } from '@/components/ui/screen';
import { Authenticated, GuestOnly } from '@/features/auth/components/auth-gate';
import { ProfilePage } from '@/features/profile/profile-page';
import { useUser } from '@clerk/expo';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

// imports for authentication and guest mode
import { GuestMode } from '@/components/profile/guest-mode';

export default function ProfileScreen() {
  const router = useRouter();

  const { isSignedIn } = useUser();
  const profile = useQuery(api.users.getCurrentProfile, isSignedIn ? {} : 'skip');
  const friends = useQuery(api.data_ml.friends.getFriends, isSignedIn ? {} : 'skip');

  return (
    <Screen className="flex-1">
      <GuestOnly>
        <GuestMode />
      </GuestOnly>
      <Authenticated>
        {profile ? (
          <ProfilePage
            profile={profile}
            secondaryStat={{
              label: 'Friends',
              value: friends?.length ?? 0,
              onPress: () => router.push('/profile/friends?source=profile'),
            }}
            activityLabel="Recent Activity"
            onPressSettings={() => router.push('/profile/settings')}
            topPaddingClassName="pt-20"
            bioFallback="No bio yet."
          />
        ) : (
          <ScrollView className="flex-1 bg-background" />
        )}
      </Authenticated>
    </Screen>
  );
}
