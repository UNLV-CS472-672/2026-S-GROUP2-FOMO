//imports for navigation and UI components
import ProfilePicture from '@/components/profile/profile-picture';
import { Button, ButtonText } from '@/components/ui/button';
import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import StatLabel from '@/components/ui/stat-label';
import { Authenticated, GuestOnly } from '@/features/auth/components/auth-gate';
import { useAppTheme } from '@/lib/use-app-theme';
import { useUser } from '@clerk/expo';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Doc } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

// imports for authentication and guest mode
import { GuestMode } from '@/components/profile/guest-mode';
import { useMemo, useState } from 'react';

//import for icons
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  const { user, isSignedIn } = useUser();
  const profile = useQuery(api.users.getCurrentProfile, isSignedIn ? {} : 'skip');
  const friends = useQuery(api.data_ml.friends.getFriends, isSignedIn ? {} : 'skip');
  const username = profile?.user.username ?? user?.username ?? 'Guest';

  //In app profile information/states
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'tagged'>('all');
  const description = profile?.user.bio?.trim() ? profile.user.bio : 'No bio yet.';
  const postsByTab = useMemo(() => {
    const allPosts = (profile?.posts ?? []).map((post: Doc<'posts'>) => ({
      id: String(post._id),
      title: post.title,
      subtitle: post.description,
    }));

    return {
      all: allPosts,
      recent: allPosts.slice(0, 6),
      tagged: [],
    };
  }, [profile?.posts]);

  return (
    <Screen className="flex-1">
      <GuestOnly>
        <GuestMode />
      </GuestOnly>
      <Authenticated>
        <ScrollView className="flex-1 bg-background pt-20" contentContainerClassName="pb-8">
          <View className="flex-row items-start p-4">
            <ProfilePicture
              imageSource={profile?.user.avatarUrl ? { uri: profile.user.avatarUrl } : undefined}
              fallbackLabel={username}
            />

            <View className="ml-3 flex-1 pr-0">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">{username}</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/profile/settings')}
                  className="-mr-3 rounded-full"
                  accessibilityLabel="Open settings"
                >
                  <MaterialIcons name="settings" size={22} color={theme.mutedText} />
                </Button>
              </View>
              <Text className="text-sm leading-5 text-foreground">{description}</Text>
            </View>
          </View>

          <View className="px-4 pb-4">
            <View className="flex-row w-full">
              <View className="flex-1 items-center">
                <StatLabel value={profile?.stats.postCount ?? 0} label="Posts" onPress={() => {}} />
              </View>
              <View className="flex-1 items-center">
                <StatLabel
                  value={friends?.length ?? 0}
                  label="Friends"
                  onPress={() => router.push('/profile/friends?source=profile')}
                />
              </View>
            </View>
          </View>

          <View className="mb-4 flex-row px-4">
            <Button variant="tertiary" className="h-[82px] flex-1 rounded-none">
              <ButtonText variant="tertiary">Recent Activity</ButtonText>
            </Button>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerClassName="px-4"
          />

          <View className="flex-row border-y border-primary-soft-border">
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${activeTab === 'all' ? 'border-b-[5px] border-b-primary' : ''}`}
              onPress={() => setActiveTab('all')}
            >
              <Text className={activeTab === 'all' ? 'text-primary' : 'text-muted-foreground'}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${activeTab === 'recent' ? 'border-b-[5px] border-b-primary' : ''}`}
              onPress={() => setActiveTab('recent')}
            >
              <Text className={activeTab === 'recent' ? 'text-primary' : 'text-muted-foreground'}>
                Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${activeTab === 'tagged' ? 'border-b-[5px] border-b-primary' : ''}`}
              onPress={() => setActiveTab('tagged')}
            >
              <Text className={activeTab === 'tagged' ? 'text-primary' : 'text-muted-foreground'}>
                Tagged
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'all' && <PostGrid posts={postsByTab.all} />}
          {activeTab === 'recent' && <PostGrid posts={postsByTab.recent} />}
          {activeTab === 'tagged' && <PostGrid posts={postsByTab.tagged} />}
        </ScrollView>
      </Authenticated>
    </Screen>
  );
}
