import { Image } from '@/components/image';
import { VideoThumbnail } from '@/components/video';
import type { TopMediaPost } from '@/features/events/types';
import { Ionicons } from '@expo/vector-icons';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type EventMediaTileProps = {
  post: TopMediaPost;
  cell: number;
  eventId: Id<'events'> | Id<'externalEvents'>;
};

export function EventMediaTile({ post, cell, eventId }: EventMediaTileProps) {
  const router = useRouter();
  const file = post.thumbnailFile;
  const mediaTypeResolved = file !== undefined;

  return (
    <Pressable
      onPress={() => {
        if (!post.mediaIds?.length) return;
        router.push({
          pathname: '/(tabs)/(map)/event/top-moments',
          params: { eventId, initialPostId: post.id },
        });
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open post by ${post.authorName}, ${post.likeCount} likes`}
      className="overflow-hidden rounded-xl bg-surface-muted"
      style={{ width: cell, height: cell }}
    >
      {file?.isVideo ? (
        <VideoThumbnail
          uri={file?.url}
          className="h-full w-full"
          fallbackClassName="h-full w-full bg-black"
        />
      ) : mediaTypeResolved && file?.url ? (
        <Image source={file.url} className="h-full w-full" contentFit="cover" />
      ) : (
        <View className="h-full w-full bg-surface-muted" />
      )}
      <View
        className="absolute bottom-1 right-1 flex-row items-center gap-0.5 rounded-md px-1 py-0.5"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        pointerEvents="none"
      >
        <Ionicons name="heart" size={11} color={post.liked ? '#FF4B6E' : '#fff'} />
        <Text
          className="text-[11px] font-semibold text-white"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {post.likeCount}
        </Text>
      </View>
    </Pressable>
  );
}
