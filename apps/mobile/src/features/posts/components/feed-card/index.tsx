import { PostActions } from '@/features/posts/components/actions';
import { Avatar } from '@/features/posts/components/avatar';
import { MediaCarousel } from '@/features/posts/components/media-carousel';
import type { FeedPost } from '@/features/posts/types';
import { formatRelativeTime } from '@/lib/format';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FeedCardMedia } from './media';

type FeedCardProps = {
  post: FeedPost;
  readOnly: boolean;
  onToggleLike: () => void;
  disableAuthorPress?: boolean;
  onPressAuthor?: () => void;
  showEventLink?: boolean;
};

export function FeedCard({
  post,
  readOnly,
  onToggleLike,
  disableAuthorPress,
  onPressAuthor,
  showEventLink = false,
}: FeedCardProps) {
  const router = useRouter();
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);

  function handlePressAuthor() {
    if (onPressAuthor) {
      onPressAuthor();
    } else if (post.authorUsername) {
      router.push({
        pathname: '/(tabs)/(map)/event/profile/[username]',
        params: { username: post.authorUsername },
      });
    }
  }

  function handlePressEvent() {
    if (!post.eventId) return;

    router.push({
      pathname: '/(tabs)/(map)/event/[eventId]',
      params: { eventId: post.eventId },
    });
  }

  return (
    <View
      className="gap-2.5 rounded-2xl border border-muted bg-surface p-3.5 shadow-xl"
      style={{ borderCurve: 'continuous' }}
    >
      {carouselIndex !== null && (
        <MediaCarousel
          mediaIds={post.mediaIds}
          initialIndex={carouselIndex}
          onClose={() => setCarouselIndex(null)}
        />
      )}

      <View className="gap-2.5">
        <View className="flex-row items-center gap-2.5">
          <Pressable hitSlop={4} disabled={disableAuthorPress} onPress={handlePressAuthor}>
            <Avatar
              name={post.authorName}
              size={36}
              source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : undefined}
            />
          </Pressable>
          <View className="min-w-0 flex-1 gap-0.5">
            <View className="flex-row items-center gap-2">
              <Pressable hitSlop={4} disabled={disableAuthorPress} onPress={handlePressAuthor}>
                <Text className="text-[15px] font-semibold text-foreground">{post.authorName}</Text>
              </Pressable>
            </View>
            {showEventLink && post.eventId && post.eventName ? (
              <Pressable className="self-start" hitSlop={4} onPress={handlePressEvent}>
                <Text className="text-[12px] text-muted-foreground">{post.eventName}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <FeedCardMedia mediaIds={post.mediaIds} onPressMedia={setCarouselIndex} />

        {post.caption ? (
          <Text className="text-[15px] leading-[21px] text-foreground">{post.caption}</Text>
        ) : null}
      </View>

      <View className="flex flex-row justify-between items-center mx-2">
        <PostActions
          post={post}
          readOnly={readOnly}
          onToggleLike={onToggleLike}
          className="pt-0.5"
        />

        <Text className="text-[12px] text-muted-foreground">
          {formatRelativeTime(post.creationTime)}
        </Text>
      </View>
    </View>
  );
}
