import { Button, ButtonText } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Avatar } from '@/features/posts/components/avatar';
import { FeedCard } from '@/features/posts/components/feed-card';
import type { FeedPost } from '@/features/posts/types';
import { buildClerkImageFile } from '@/features/profile/clerk-image';
import { MediaGrid, type GridMediaItem } from '@/features/profile/components/media-grid';
import StatLabel from '@/features/profile/components/stat-label';
import { useGuest } from '@/integrations/session/guest';
import { useAppTheme } from '@/lib/use-app-theme';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { FunctionReturnType } from 'convex/server';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type ProfilePageProps = {
  profile: NonNullable<FunctionReturnType<typeof api.users.getCurrentProfile>>;
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
  mediaFeedPathname?: string;
  viewerUserId?: Id<'users'>;
  profileAction?: ReactNode;
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

function ProfileIconAction({
  accessibilityLabel,
  className,
  disabled,
  iconName,
  iconColor,
  onPress,
}: {
  accessibilityLabel: string;
  className?: string;
  disabled?: boolean;
  iconName: ComponentProps<typeof MaterialIcons>['name'];
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={cn(
        'size-12 items-center justify-center rounded-full bg-card shadow-sm',
        className
      )}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => [
        pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
        disabled && { opacity: 0.5 },
      ]}
      onPress={onPress}
    >
      <MaterialIcons name={iconName} size={20} color={iconColor} />
    </Pressable>
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
  mediaFeedPathname = '/profile/media-feed',
  viewerUserId,
  profileAction,
}: ProfilePageProps) {
  const userId = profile.user._id;
  const theme = useAppTheme();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const { isGuestMode } = useGuest();
  const togglePostLike = useMutation(api.likes.togglePostLike);
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);
  const cancelFriendRequest = useMutation(api.friends.cancelFriendRequest);
  const declineFriendRequest = useMutation(api.friends.declineFriendRequest);
  const [activeTab, setActiveTab] = useState<'feed' | 'media'>('feed');
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);
  const [isUpdatingFriendship, setIsUpdatingFriendship] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const friendship = useQuery(
    api.friends.getFriendshipStatusForUser,
    isAuthenticated && viewerUserId && viewerUserId !== userId ? { otherUserId: userId } : 'skip'
  );

  function handlePressGridItem(item: GridMediaItem) {
    router.push({
      pathname: mediaFeedPathname as never,
      params: { userId, initialPostId: item.postId },
    });
  }

  const mediaItems: GridMediaItem[] = feedPosts
    .filter((p) => p.mediaIds.length > 0)
    .map((p) => ({
      id: p.id,
      postId: p.id,
      mediaId: p.mediaIds[0] as Id<'_storage'>,
    }));
  const profileBio = profile.user.bio ?? bioFallback;
  const relationshipStatus = friendship?.status;
  const isOwnProfile = viewerUserId === userId;

  async function handleSendFriendRequest() {
    if (!viewerUserId || viewerUserId === userId || isSendingFriendRequest) {
      return;
    }

    setIsSendingFriendRequest(true);
    try {
      await sendFriendRequest({ recipientId: userId });
    } catch (error) {
      console.error('Failed to send friend request', error);
      Alert.alert('Unable to send request', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSendingFriendRequest(false);
    }
  }

  async function handleRespondToFriendRequest(action: 'accept' | 'decline') {
    if (!viewerUserId || viewerUserId === userId || isUpdatingFriendship) {
      return;
    }

    setIsUpdatingFriendship(true);
    try {
      if (action === 'accept') {
        await acceptFriendRequest({ requesterId: userId });
      } else {
        await declineFriendRequest({ requesterId: userId });
      }
    } catch (error) {
      console.error(`Failed to ${action} friend request`, error);
      Alert.alert(
        'Unable to update request',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setIsUpdatingFriendship(false);
    }
  }

  const showIncomingFriendRequestActions =
    viewerUserId && viewerUserId !== userId && relationshipStatus === 'pending_received';
  const showHeaderFriendAction =
    viewerUserId && viewerUserId !== userId && relationshipStatus !== 'pending_received';

  async function handleUpdateProfileImageFromGallery() {
    if (!clerkUser || isUploadingAvatar) {
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo access needed',
          'Allow photo library access to choose a new profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
      });

      if (result.canceled || !result.assets.length) {
        return;
      }

      const selectedAsset = result.assets[0];
      const selectedUri = selectedAsset?.uri;
      if (!selectedAsset || !selectedUri) {
        return;
      }

      const file = await buildClerkImageFile({
        uri: selectedUri,
        base64: selectedAsset.base64,
        fileName: selectedAsset.fileName,
        mimeType: selectedAsset.mimeType,
      });

      await clerkUser.setProfileImage({ file });
      await clerkUser.reload();
    } catch (error) {
      console.error('Failed to update profile picture', error);
      Alert.alert(
        'Unable to update photo',
        error instanceof Error ? error.message : 'Try again later.'
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <Screen className="flex-1">
      <ScrollView
        className={`flex-1 bg-background ${topPaddingClassName}`}
        contentContainerClassName="pb-8"
      >
        <View className="flex-row items-start px-4 pb-4 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isOwnProfile ? 'Edit profile picture' : 'Profile picture'}
            disabled={!isOwnProfile || isUploadingAvatar}
            hitSlop={8}
            onPress={() => {
              if (!isOwnProfile) return;
              void handleUpdateProfileImageFromGallery();
            }}
          >
            <Avatar
              name={profile.user.displayName || profile.user.username}
              size={92}
              source={profile.user.avatarUrl ? { uri: profile.user.avatarUrl } : undefined}
            />
          </Pressable>

          <View className="ml-3 flex-1 pr-0">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-bold text-foreground">{profile.user.username}</Text>
                {profile.user.displayName ? (
                  <Text className="text-sm text-muted-foreground">{profile.user.displayName}</Text>
                ) : null}
              </View>
              {profileAction || showHeaderFriendAction || onPressSettings ? (
                <View className="-mr-3 flex-row items-center gap-1">
                  {profileAction ? <View>{profileAction}</View> : null}
                  {showHeaderFriendAction ? (
                    <ProfileIconAction
                      accessibilityLabel={
                        relationshipStatus === 'pending_sent'
                          ? 'Remove pending friend request'
                          : relationshipStatus === 'accepted'
                            ? 'Friends'
                            : 'Add friend'
                      }
                      disabled={
                        relationshipStatus === undefined ||
                        relationshipStatus === 'accepted' ||
                        isSendingFriendRequest ||
                        isUpdatingFriendship
                      }
                      iconName={
                        relationshipStatus === 'pending_sent'
                          ? 'person-remove'
                          : relationshipStatus === 'accepted'
                            ? 'people'
                            : 'person-add-alt-1'
                      }
                      iconColor={theme.tint}
                      onPress={() => {
                        if (relationshipStatus === 'pending_sent') {
                          void (async () => {
                            if (isUpdatingFriendship) {
                              return;
                            }

                            setIsUpdatingFriendship(true);
                            try {
                              await cancelFriendRequest({ recipientId: userId });
                            } catch (error) {
                              console.error('Failed to cancel friend request', error);
                              Alert.alert(
                                'Unable to remove request',
                                error instanceof Error ? error.message : 'Try again.'
                              );
                            } finally {
                              setIsUpdatingFriendship(false);
                            }
                          })();
                          return;
                        }

                        if (relationshipStatus === 'none') {
                          void handleSendFriendRequest();
                        }
                      }}
                    />
                  ) : null}
                  {onPressSettings ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={onPressSettings}
                      className="rounded-full"
                      accessibilityLabel="Open settings"
                    >
                      <MaterialIcons name="settings" size={22} color={theme.mutedText} />
                    </Button>
                  ) : null}
                </View>
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
          {showIncomingFriendRequestActions ? (
            <View className="mt-4 flex-row gap-3">
              <Button
                className="flex-1"
                onPress={() => {
                  void handleRespondToFriendRequest('accept');
                }}
                disabled={isUpdatingFriendship}
                accessibilityLabel="Accept friend request"
              >
                <ButtonText>{isUpdatingFriendship ? 'Updating...' : 'Accept'}</ButtonText>
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onPress={() => {
                  void handleRespondToFriendRequest('decline');
                }}
                disabled={isUpdatingFriendship}
                accessibilityLabel="Decline friend request"
              >
                <ButtonText variant="secondary">Decline</ButtonText>
              </Button>
            </View>
          ) : null}
        </View>

        {/* TODO :: SEE WHAT TO DO HERE */}
        {/* <View className="mb-4 flex-row px-4"> */}
        {/*   <Button variant="tertiary" className="h-[82px] flex-1 rounded-none"> */}
        {/*     <ButtonText variant="tertiary">{activityLabel}</ButtonText> */}
        {/*   </Button> */}
        {/* </View> */}

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
            <View className="gap-3 pt-4 px-4">
              {feedPosts.map((post) => (
                <FeedCard
                  key={post.id}
                  post={post}
                  readOnly={isGuestMode}
                  showEventLink
                  disableAuthorPress
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
          <MediaGrid posts={mediaItems} onPressItem={handlePressGridItem} />
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-muted-foreground">No media posts yet</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
