import { MediaCarousel } from '@/features/events/components/media-carousel';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';

type EventMediaPost = {
  id: string;
  authorName: string;
  likeCount: number;
  mediaIds: Id<'_storage'>[];
};

type TopMomentsProps = {
  posts: EventMediaPost[];
};

const H_PAD = 16;
const COL_GAP = 6;
const ROW_GAP = 6;
const NUM_COLS = 3;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

type EventMediaTileProps = {
  post: EventMediaPost;
  cell: number;
};

function EventMediaTile({ post, cell }: EventMediaTileProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const thumbnailId = post.mediaIds[0]!;
  const mediaUrl = useQuery(api.files.getUrl, thumbnailId ? { storageId: thumbnailId } : 'skip');
  const imageSource = mediaUrl ? { uri: mediaUrl } : undefined;

  return (
    <>
      {carouselOpen && (
        <MediaCarousel
          mediaIds={post.mediaIds ?? []}
          initialIndex={0}
          onClose={() => setCarouselOpen(false)}
        />
      )}
      <Pressable
        onPress={() => post.mediaIds?.length && setCarouselOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Open post by ${post.authorName}, ${post.likeCount} likes`}
        className="overflow-hidden rounded-xl bg-surface-muted"
        style={{ width: cell, height: cell }}
      >
        {imageSource ? (
          <Image source={imageSource} className="h-full w-full" resizeMode="cover" />
        ) : null}
        <View
          className="absolute bottom-1 right-1 flex-row items-center gap-0.5 rounded-md px-1 py-0.5"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          pointerEvents="none"
        >
          <Ionicons name="heart" size={11} color="#fff" />
          <Text
            className="text-[11px] font-semibold text-white"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {post.likeCount}
          </Text>
        </View>
      </Pressable>
    </>
  );
}

export function TopMoments({ posts }: TopMomentsProps) {
  const { width } = useWindowDimensions();

  if (posts.length === 0) return null;

  const inner = width - H_PAD * 2;
  const cell = (inner - COL_GAP * (NUM_COLS - 1)) / NUM_COLS;
  const rows = chunk(posts, NUM_COLS);

  return (
    <View className="gap-2 px-4 pt-4">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[17px] font-bold text-foreground">Top moments</Text>
        <Text className="text-[12px] text-muted-foreground">Most liked</Text>
      </View>

      <View style={{ gap: ROW_GAP }}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row" style={{ gap: COL_GAP }}>
            {row.map((post) => (
              <EventMediaTile key={post.id} post={post} cell={cell} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
