import ProfilePicture from '@/components/profile/profile-picture';
import { Button, ButtonText } from '@/components/ui/button';
import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import StatLabel from '@/components/ui/stat-label';
import { useAppTheme } from '@/lib/use-app-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function VisitFriendProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams();

  // Prefer stable id for DB-backed records; keep username fallback for legacy links.
  const friendId = Array.isArray(params.id) ? params.id[0] : params.id;
  const friendUsername = Array.isArray(params.username) ? params.username[0] : params.username;

  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'tagged'>('all');
  const profileById = useQuery(
    api.users.getProfileById,
    friendId ? { userId: friendId as Id<'users'> } : 'skip'
  );
  const profileByName = useQuery(
    api.users.getProfileByName,
    !friendId && friendUsername ? { name: friendUsername } : 'skip'
  );
  const friendProfile = profileById ?? profileByName;

  if (!friendId && !friendUsername) {
    return (
      <Screen className="flex-1 items-center justify-center">
        <Text className="text-foreground">Friend not found</Text>
        <Button onPress={() => router.back()}>
          <ButtonText>Go Back</ButtonText>
        </Button>
      </Screen>
    );
  }

  if (
    (friendId && profileById === undefined) ||
    (!friendId && friendUsername && profileByName === undefined)
  ) {
    return (
      <Screen className="flex-1 items-center justify-center">
        <Text className="text-foreground">Loading profile...</Text>
      </Screen>
    );
  }

  if (!friendProfile) {
    return (
      <Screen className="flex-1 items-center justify-center">
        <Text className="text-foreground">Friend&apos;s profile not found</Text>
        <Button onPress={() => router.back()}>
          <ButtonText>Go Back</ButtonText>
        </Button>
      </Screen>
    );
  }

  const postsByTab = (() => {
    const allPosts = friendProfile.posts.map((post) => ({
      id: String(post._id),
      title: post.title,
      subtitle: post.description,
    }));

    return {
      all: allPosts,
      recent: allPosts.slice(0, 6),
      tagged: [],
    };
  })();
  const displayPosts = postsByTab[activeTab];
  const profileBio = friendProfile.user.bio?.trim()
    ? friendProfile.user.bio
    : `Hey! I am ${friendProfile.user.displayName ?? friendProfile.user.username}.`;
  const profileStats = {
    postCount: friendProfile.stats.postCount,
    eventCount: friendProfile.stats.eventCount,
  };

  return (
    <Screen className="flex-1">
      <ScrollView className="flex-1 bg-background pt-14">
        {/* Header with Back Button */}
        <View className="flex-row items-center justify-between px-4 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Profile Header Section */}
        <View className="flex-row items-start px-4 pb-4 pt-2">
          <ProfilePicture
            imageSource={
              friendProfile.user.avatarUrl ? { uri: friendProfile.user.avatarUrl } : undefined
            }
            fallbackLabel={friendProfile.user.username}
          />

          <View className="ml-3 flex-1 pr-0">
            <Text className="text-lg font-bold text-foreground">{friendProfile.user.username}</Text>
            {friendProfile.user.displayName ? (
              <Text className="text-sm text-muted-foreground">
                {friendProfile.user.displayName}
              </Text>
            ) : null}
            <Text className="mt-1 text-sm leading-5 text-foreground">{profileBio}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View className="px-4 pb-4">
          <View className="flex-row w-full">
            <View className="flex-1 items-center">
              <StatLabel value={profileStats.postCount} label="Posts" onPress={() => {}} />
            </View>
            <View className="flex-1 items-center">
              <StatLabel value={profileStats.eventCount} label="Events" onPress={() => {}} />
            </View>
          </View>
        </View>

        <View className="mb-4 flex-row px-4">
          <Button variant="tertiary" className="h-[82px] flex-1 rounded-none">
            <ButtonText variant="tertiary">Recent Events</ButtonText>
          </Button>
        </View>

        {/* Tabs Section */}
        <View className="flex-row border-y border-primary-soft-border">
          <TouchableOpacity
            className={`flex-1 items-center py-3 ${
              activeTab === 'all' ? 'border-b-[5px] border-b-primary' : ''
            }`}
            onPress={() => setActiveTab('all')}
            accessibilityRole="tab"
            accessibilityLabel="All posts tab"
            accessibilityState={{ selected: activeTab === 'all' }}
          >
            <Text
              className={
                activeTab === 'all' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center py-3 ${
              activeTab === 'recent' ? 'border-b-[5px] border-b-primary' : ''
            }`}
            onPress={() => setActiveTab('recent')}
            accessibilityRole="tab"
            accessibilityLabel="Recent posts tab"
            accessibilityState={{ selected: activeTab === 'recent' }}
          >
            <Text
              className={
                activeTab === 'recent' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }
            >
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center py-3 ${
              activeTab === 'tagged' ? 'border-b-[5px] border-b-primary' : ''
            }`}
            onPress={() => setActiveTab('tagged')}
            accessibilityRole="tab"
            accessibilityLabel="Tagged posts tab"
            accessibilityState={{ selected: activeTab === 'tagged' }}
          >
            <Text
              className={
                activeTab === 'tagged' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }
            >
              Tagged
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        {displayPosts.length > 0 ? (
          <PostGrid posts={displayPosts} />
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-muted-foreground">No posts in this category</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
