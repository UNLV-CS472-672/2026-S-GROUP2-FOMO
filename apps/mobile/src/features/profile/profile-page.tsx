import ProfilePicture from '@/components/profile/profile-picture';
import { Button, ButtonText } from '@/components/ui/button';
import PostGrid from '@/components/ui/post-grid';
import { Screen } from '@/components/ui/screen';
import StatLabel from '@/components/ui/stat-label';
import { useAppTheme } from '@/lib/use-app-theme';
import { MaterialIcons } from '@expo/vector-icons';
import type { Doc } from '@fomo/backend/convex/_generated/dataModel';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type ProfileData = {
  user: {
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
  };
  posts: Doc<'posts'>[];
  stats: {
    postCount: number;
    eventCount: number;
  };
};

type ProfilePageProps = {
  profile: ProfileData;
  secondaryStat: {
    label: string;
    value: number;
    onPress?: () => void;
  };
  activityLabel: string;
  emptyPostsMessage?: string;
  onPressSettings?: () => void;
  topPaddingClassName?: string;
  bioFallback?: string;
};

type ProfileStateScreenProps = {
  message: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export function ProfileStateScreen({
  message,
  actionLabel,
  onPressAction,
}: ProfileStateScreenProps) {
  return (
    <Screen className="flex-1 items-center justify-center gap-4 px-6">
      <Text className="text-center text-foreground">{message}</Text>
      {actionLabel && onPressAction ? (
        <Button onPress={onPressAction}>
          <ButtonText>{actionLabel}</ButtonText>
        </Button>
      ) : null}
    </Screen>
  );
}

export function ProfilePage({
  profile,
  secondaryStat,
  activityLabel,
  emptyPostsMessage = 'No posts in this category',
  onPressSettings,
  topPaddingClassName = 'pt-20',
  bioFallback,
}: ProfilePageProps) {
  const theme = useAppTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'tagged'>('all');

  const postsByTab = (() => {
    const allPosts = profile.posts.map((post) => ({
      id: String(post._id),
      title: post.caption ?? 'Untitled post',
      subtitle: '',
    }));

    return {
      all: allPosts,
      recent: allPosts.slice(0, 6),
      tagged: [],
    };
  })();

  const displayPosts = postsByTab[activeTab];
  const profileBio = profile.user.bio;

  return (
    <Screen className="flex-1">
      <ScrollView
        className={`flex-1 bg-background ${topPaddingClassName}`}
        contentContainerClassName="pb-8"
      >
        <View className="flex-row items-start px-4 pb-4 pt-2">
          <ProfilePicture
            imageSource={profile.user.avatarUrl ? { uri: profile.user.avatarUrl } : undefined}
            fallbackLabel={profile.user.username}
          />

          <View className="ml-3 flex-1 pr-0">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-bold text-foreground">{profile.user.username}</Text>
                {profile.user.displayName ? (
                  <Text className="text-sm text-muted-foreground">{profile.user.displayName}</Text>
                ) : null}
              </View>
              {onPressSettings ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={onPressSettings}
                  className="-mr-3 rounded-full"
                  accessibilityLabel="Open settings"
                >
                  <MaterialIcons name="settings" size={22} color={theme.mutedText} />
                </Button>
              ) : null}
            </View>
            <Text className="mt-1 text-sm leading-5 text-foreground">{profileBio}</Text>
          </View>
        </View>

        <View className="px-4 pb-4">
          <View className="w-full flex-row">
            <View className="flex-1 items-center">
              <StatLabel value={profile.stats.postCount} label="Posts" onPress={() => {}} />
            </View>
            <View className="flex-1 items-center">
              <StatLabel
                value={secondaryStat.value}
                label={secondaryStat.label}
                onPress={secondaryStat.onPress ?? (() => {})}
              />
            </View>
          </View>
        </View>

        <View className="mb-4 flex-row px-4">
          <Button variant="tertiary" className="h-[82px] flex-1 rounded-none">
            <ButtonText variant="tertiary">{activityLabel}</ButtonText>
          </Button>
        </View>

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
                activeTab === 'all' ? 'font-semibold text-primary' : 'text-muted-foreground'
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
                activeTab === 'recent' ? 'font-semibold text-primary' : 'text-muted-foreground'
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
                activeTab === 'tagged' ? 'font-semibold text-primary' : 'text-muted-foreground'
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
            <Text className="text-muted-foreground">{emptyPostsMessage}</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
