import ProfilePicture from '@/components/profile/profile-picture';
import { Button, ButtonText } from '@/components/ui/button';
import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import StatLabel from '@/components/ui/stat-label';
import { useAppTheme } from '@/lib/use-app-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { allFriendProfiles } from './friend-data';

export default function VisitFriendProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams();

  // Safely extract username from params
  const friendUsername = Array.isArray(params.username) ? params.username[0] : params.username;

  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'tagged'>('all');

  if (!friendUsername) {
    return (
      <Screen className="flex-1 items-center justify-center">
        <Text className="text-foreground">Friend not found</Text>
        <Button onPress={() => router.back()}>
          <ButtonText>Go Back</ButtonText>
        </Button>
      </Screen>
    );
  }

  const friendProfile = allFriendProfiles.find((friend) => friend.username === friendUsername);

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

  const displayPosts = friendProfile.posts[activeTab];

  return (
    <Screen className="flex-1">
      <ScrollView className="flex-1 bg-background pt-20">
        <View className="px-4 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
            className="-ml-3 self-start rounded-full"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={22} color={theme.mutedText} />
          </Button>
        </View>

        <View className="flex-row items-start p-4">
          <ProfilePicture imageSource={friendProfile.imageSource} />

          <View className="ml-3 flex-1 pr-0">
            <Text className="text-lg font-bold text-foreground">{friendProfile.username}</Text>
            <Text className="mt-1 text-sm leading-5 text-foreground">{friendProfile.bio}</Text>
          </View>
        </View>

        <View className="px-4 pb-4">
          <View className="flex-row w-full">
            <View className="flex-1 items-center">
              <StatLabel value={friendProfile.stats.postCount} label="Posts" onPress={() => {}} />
            </View>
            <View className="flex-1 items-center">
              <StatLabel
                value={friendProfile.stats.friendCount}
                label="Friends"
                onPress={() => {}}
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
