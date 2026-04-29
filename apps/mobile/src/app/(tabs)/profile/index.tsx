import { ButtonText } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Authenticated, GuestOnly } from '@/features/auth/components/auth-gate';
import { ProfilePage } from '@/features/profile/profile-page';
import { useAppTheme } from '@/lib/use-app-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import { useConvexAuth, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

// imports for authentication and guest mode
import { GuestMode } from '@/features/profile/components/guest-mode';

export default function ProfileScreen() {
  const router = useRouter();

  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getCurrentProfile, isAuthenticated ? {} : 'skip');
  const friends = useQuery(api.data_ml.friends.getFriends, isAuthenticated ? {} : 'skip');
  const friendRequests = useQuery(api.friends.getFriendRequests, isAuthenticated ? {} : 'skip');
  const feedPosts = useQuery(
    api.users.getProfileFeed,
    profile ? { userId: profile.user._id } : 'skip'
  );

  return (
    <Screen className="flex-1">
      <GuestOnly>
        <GuestMode />
      </GuestOnly>
      <Authenticated>
        {profile ? (
          <ProfilePage
            profile={profile}
            feedPosts={feedPosts ?? []}
            secondaryStat={{
              label: 'Friends',
              value: friends?.length ?? 0,
              onPress: () => router.push('/profile/friends?source=profile'),
            }}
            activityLabel="Recent Activity"
            onPressSettings={() => router.push('/profile/settings')}
            topPaddingClassName="pt-20"
            bioFallback="No bio yet."
            viewerUserId={profile.user._id}
            profileAction={
              <ProfileRequestsButton
                count={friendRequests?.received.length ?? 0}
                onPress={() => router.push('/profile/friend-requests')}
              />
            }
          />
        ) : (
          <ScrollView className="flex-1 bg-background" />
        )}
      </Authenticated>
    </Screen>
  );
}

function ProfileRequestsButton({ count, onPress }: { count: number; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <View>
      <Pressable
        accessibilityLabel="Friend requests"
        accessibilityRole="button"
        className="size-12 items-center justify-center rounded-full bg-card shadow-sm"
        hitSlop={10}
        style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] }]}
        onPress={onPress}
      >
        <MaterialIcons name="person-add-alt-1" size={20} color={theme.tint} />
      </Pressable>
      {count > 0 ? (
        <View className="absolute -right-1 -top-1 min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
          <ButtonText className="text-xs text-primary-foreground">
            {count > 9 ? '9+' : count}
          </ButtonText>
        </View>
      ) : null}
    </View>
  );
}
