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
};

export function FeedCard({
  post,
  readOnly,
  onToggleLike,
  disableAuthorPress,
  onPressAuthor,
}: FeedCardProps) {
  const router = useRouter();
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);

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
        <Pressable
          className="flex-row items-center gap-2.5"
          hitSlop={4}
          disabled={disableAuthorPress}
          onPress={() => {
            if (onPressAuthor) {
              onPressAuthor();
            } else if (post.authorUsername) {
              router.push({
                pathname: '/(tabs)/(map)/event/profile/[username]',
                params: { username: post.authorUsername },
              });
            }
          }}
        >
          <Avatar
            name={post.authorName}
            size={36}
            source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : undefined}
          />
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Text className="text-[15px] font-semibold text-foreground">{post.authorName}</Text>
            <Text className="text-[12px] text-muted-foreground">
              {formatRelativeTime(post.creationTime)}
            </Text>
          </View>
        </Pressable>

        <FeedCardMedia mediaIds={post.mediaIds} onPressMedia={setCarouselIndex} />

        {post.caption ? (
          <Text className="text-[15px] leading-[21px] text-foreground">{post.caption}</Text>
        ) : null}
      </View>

      <PostActions
        post={post}
        readOnly={readOnly}
        onToggleLike={onToggleLike}
        className="ml-2 pt-0.5"
      />
    </View>
  );
}
