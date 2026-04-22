import { Image } from '@/components/image';
import { VideoPlayer } from '@/components/video';
import { Avatar } from '@/features/posts/components/avatar';
import { CommentDrawer } from '@/features/posts/components/comment-drawer';
import { MediaCarousel } from '@/features/posts/components/media-carousel';
import type { FeedPost } from '@/features/posts/types';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type FeedCardProps = {
  post: FeedPost;
  readOnly: boolean;
  onToggleLike: () => void;
};

type MediaTileProps = {
  mediaId: FeedPost['mediaIds'][number] | undefined;
  className: string;
  overlayLabel?: string;
  onPress?: () => void;
};

function MediaTile({ mediaId, className, overlayLabel, onPress }: MediaTileProps) {
  const mediaUrl = useQuery(api.files.getUrl, mediaId ? { storageId: mediaId } : 'skip');
  const mediaMetadata = useQuery(api.files.getMetadata, mediaId ? { storageId: mediaId } : 'skip');
  const mediaTypeResolved = mediaMetadata !== undefined;
  const isVideo = mediaMetadata?.contentType?.startsWith('video/') ?? false;

  const inner = (
    <>
      {isVideo ? (
        <VideoPlayer uri={mediaUrl} className="h-full w-full bg-black" showPlaybackToggle />
      ) : mediaTypeResolved && mediaUrl ? (
        <Image source={mediaUrl} className="h-full w-full" contentFit="cover" />
      ) : (
        <View className="h-full w-full bg-surface-muted" />
      )}
      {overlayLabel ? (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <Text className="text-xl font-bold text-white">{overlayLabel}</Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`overflow-hidden rounded-xl bg-surface-muted ${className}`}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View className={`overflow-hidden rounded-xl bg-surface-muted ${className}`}>{inner}</View>
  );
}

function FeedCardMedia({
  mediaIds,
  onPressMedia,
}: {
  mediaIds: FeedPost['mediaIds'];
  onPressMedia: (index: number) => void;
}) {
  if (mediaIds.length === 0) return null;

  if (mediaIds.length === 1) {
    return (
      <MediaTile
        mediaId={mediaIds[0]!}
        className="h-[220px] w-full"
        onPress={() => onPressMedia(0)}
      />
    );
  }

  if (mediaIds.length === 2) {
    return (
      <View className="h-[220px] flex-row gap-2">
        <MediaTile mediaId={mediaIds[0]!} className="flex-1" onPress={() => onPressMedia(0)} />
        <MediaTile mediaId={mediaIds[1]!} className="flex-1" onPress={() => onPressMedia(1)} />
      </View>
    );
  }

  if (mediaIds.length === 3) {
    return (
      <View className="h-[240px] gap-2">
        <MediaTile
          mediaId={mediaIds[0]!}
          className="h-[148px] w-full"
          onPress={() => onPressMedia(0)}
        />
        <View className="flex-1 flex-row gap-2">
          <MediaTile mediaId={mediaIds[1]!} className="flex-1" onPress={() => onPressMedia(1)} />
          <MediaTile mediaId={mediaIds[2]!} className="flex-1" onPress={() => onPressMedia(2)} />
        </View>
      </View>
    );
  }

  const showOverlay = mediaIds.length === 5;

  return (
    <View className="h-[240px] gap-2">
      <View className="flex-1 flex-row gap-2">
        <MediaTile mediaId={mediaIds[0]!} className="flex-1" onPress={() => onPressMedia(0)} />
        <MediaTile mediaId={mediaIds[1]!} className="flex-1" onPress={() => onPressMedia(1)} />
      </View>
      <View className="flex-1 flex-row gap-2">
        <MediaTile mediaId={mediaIds[2]!} className="flex-1" onPress={() => onPressMedia(2)} />
        <MediaTile
          mediaId={mediaIds[3]!}
          className="flex-1"
          overlayLabel={showOverlay ? '+1' : undefined}
          onPress={() => onPressMedia(3)}
        />
      </View>
    </View>
  );
}

export function FeedCard({ post, readOnly, onToggleLike }: FeedCardProps) {
  const theme = useAppTheme();
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
        <View className="flex-row items-center gap-2.5">
          <Avatar
            name={post.authorName}
            size={36}
            source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : undefined}
          />
          <Text className="text-[15px] font-semibold text-foreground">{post.authorName}</Text>
        </View>

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
