import { Image } from '@/components/image';
import { Avatar } from '@/features/events/components/avatar';
import type { FeedPost } from '@/features/events/types';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Pressable, Text, View } from 'react-native';

type FeedCardProps = {
  post: FeedPost;
  readOnly: boolean;
  onOpenPost: () => void;
  onToggleLike: () => void;
};

export function FeedCard({ post, readOnly, onOpenPost, onToggleLike }: FeedCardProps) {
  const theme = useAppTheme();
  const mediaUrl = useQuery(api.files.getUrl, post.mediaId ? { storageId: post.mediaId } : 'skip');

  return (
    <View
      className="gap-2.5 rounded-2xl shadow-xl border border-muted bg-surface p-3.5"
      style={{ borderCurve: 'continuous' }}
    >
      <Pressable
        onPress={onOpenPost}
        accessibilityRole="button"
        accessibilityLabel={`Open post by ${post.authorName}`}
        className="gap-2.5"
      >
        <View className="flex-row items-center gap-2.5">
          <Avatar
            name={post.authorName}
            size={36}
            source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : undefined}
          />
          <Text className="text-[15px] font-semibold text-foreground">{post.authorName}</Text>
        </View>

        {post.caption ? (
          <Text className="text-[15px] leading-[21px] text-foreground">{post.caption}</Text>
        ) : null}

        {mediaUrl ? (
          <Image source={mediaUrl} className="h-[180px] w-full rounded-xl" contentFit="cover" />
        ) : null}
      </Pressable>

      <View className="flex-row items-center gap-5 pt-0.5">
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

        <Pressable onPress={onOpenPost} className="flex-row items-center gap-1.5" hitSlop={8}>
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
