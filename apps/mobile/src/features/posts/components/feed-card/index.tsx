import { Avatar } from '@/features/posts/components/avatar';
import { CommentDrawer } from '@/features/posts/components/comment/drawer';
import { MediaCarousel } from '@/features/posts/components/media-carousel';
import type { FeedPost } from '@/features/posts/types';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
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
  const theme = useAppTheme();
  const router = useRouter();
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

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

      <CommentDrawer
        open={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        post={post}
        readOnly={readOnly}
      />

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
          <Text className="text-[15px] font-semibold text-foreground">{post.authorName}</Text>
        </Pressable>

        <FeedCardMedia mediaIds={post.mediaIds} onPressMedia={setCarouselIndex} />

        {post.caption ? (
          <Text className="text-[15px] leading-[21px] text-foreground">{post.caption}</Text>
        ) : null}
      </View>

      <View className="ml-2 flex-row items-center gap-5 pt-0.5">
        <Pressable
          onPress={onToggleLike}
          className="flex-row items-center gap-1.5"
          hitSlop={8}
          disabled={readOnly}
          style={{ opacity: readOnly ? 0.5 : 1 }}
        >
          <Ionicons
            name={post.liked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.liked ? '#FF4B6E' : theme.mutedText}
          />
          <Text
            className="text-[13px] text-muted-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {post.likes}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsCommentsOpen(true)}
          className="flex-row items-center gap-1.5"
          hitSlop={8}
        >
          <Ionicons name="chatbubble-outline" size={18} color={theme.mutedText} />
          <Text
            className="text-[13px] text-muted-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {post.commentCount}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
