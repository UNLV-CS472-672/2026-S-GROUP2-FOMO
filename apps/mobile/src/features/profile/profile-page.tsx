import { Button, ButtonText } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import StatLabel from '@/components/ui/stat-label';
import { Avatar } from '@/features/posts/components/avatar';
import { FeedCard } from '@/features/posts/components/feed-card';
import type { FeedPost } from '@/features/posts/types';
import { useGuest } from '@/integrations/session/provider';
import { useAppTheme } from '@/lib/use-app-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Doc, Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
  feedPosts: FeedPost[];
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

function MediaGridItem({ postId, mediaId }: { postId: string; mediaId: Id<'_storage'> }) {
  const router = useRouter();
  const mediaUrl = useQuery(api.files.getUrl, { storageId: mediaId });

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '../profile/post-details',
          params: { postId },
        })
      }
      className="aspect-square w-1/3"
    >
      {mediaUrl ? (
        <Image source={{ uri: mediaUrl }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <View className="h-full w-full bg-primary/5" />
      )}
    </TouchableOpacity>
  );
}

export function ProfilePage({
  profile,
  feedPosts,
  secondaryStat,
  activityLabel,
  emptyPostsMessage = 'No posts yet',
  onPressSettings,
  topPaddingClassName = 'pt-20',
  bioFallback,
}: ProfilePageProps) {
  const theme = useAppTheme();
  const { isGuestMode } = useGuest();
  const togglePostLike = useMutation(api.likes.togglePostLike);
  const [activeTab, setActiveTab] = useState<'feed' | 'media'>('feed');

  const mediaItems = feedPosts.flatMap((p) =>
    p.mediaIds.map((mediaId) => ({
      key: `${p.id}-${mediaId}`,
      postId: p.id,
      mediaId: mediaId as Id<'_storage'>,
    }))
  );
  const profileBio = profile.user.bio ?? bioFallback;

  return (
    <Screen className="flex-1">
      <ScrollView
        className={`flex-1 bg-background ${topPaddingClassName}`}
        contentContainerClassName="pb-8"
      >
        <View className="flex-row items-start px-4 pb-4 pt-2">
          <View>
            <Avatar
              name={profile.user.displayName || profile.user.username}
              size={92}
              source={profile.user.avatarUrl ? { uri: profile.user.avatarUrl } : undefined}
            />
          </View>

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
            {profileBio ? (
              <Text className="mt-1 text-sm leading-5 text-foreground">{profileBio}</Text>
            ) : null}
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
              activeTab === 'feed' ? 'border-b-[5px] border-b-primary' : ''
            }`}
            onPress={() => setActiveTab('feed')}
            accessibilityRole="tab"
            accessibilityLabel="Feed tab"
            accessibilityState={{ selected: activeTab === 'feed' }}
          >
            <Text
              className={
                activeTab === 'feed' ? 'font-semibold text-primary' : 'text-muted-foreground'
              }
            >
              Feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center py-3 ${
              activeTab === 'media' ? 'border-b-[5px] border-b-primary' : ''
            }`}
            onPress={() => setActiveTab('media')}
            accessibilityRole="tab"
            accessibilityLabel="Media tab"
            accessibilityState={{ selected: activeTab === 'media' }}
          >
            <Text
              className={
                activeTab === 'media' ? 'font-semibold text-primary' : 'text-muted-foreground'
              }
            >
              Media
            </Text>
          </TouchableOpacity>
          {/* Tagged tab - TODO :: uncommment when ready
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
          */}
        </View>

        {activeTab === 'feed' ? (
          feedPosts.length > 0 ? (
            <View className="gap-3 pt-4 mx-2">
              {feedPosts.map((post) => (
                <FeedCard
                  key={post.id}
                  post={post}
                  readOnly={isGuestMode}
                  onToggleLike={() => {
                    if (isGuestMode) return;
                    void togglePostLike({ postId: post.id as Id<'posts'> }).catch((error) => {
                      console.error('Failed to toggle profile post like', error);
                    });
                  }}
                />
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-8">
              <Text className="text-muted-foreground">{emptyPostsMessage}</Text>
            </View>
          )
        ) : mediaItems.length > 0 ? (
          <FlatList
            data={mediaItems}
            renderItem={({ item }) => <MediaGridItem postId={item.postId} mediaId={item.mediaId} />}
            keyExtractor={(item) => item.key}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-muted-foreground">No media posts yet</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
