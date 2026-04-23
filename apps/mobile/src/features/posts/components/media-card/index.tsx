import { Dots } from '@/components/ui/dots';
import { PostActions } from '@/features/posts/components/actions';
import { Avatar } from '@/features/posts/components/avatar';
import { MediaCarousel } from '@/features/posts/components/media-carousel';
import type { FeedPost } from '@/features/posts/types';
import { formatRelativeTime } from '@/lib/format';
import { useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { MediaItem } from './item';

type MediaCardProps = {
  post: FeedPost;
  readOnly: boolean;
  onToggleLike: () => void;
  onPressAuthor?: () => void;
};

export function MediaCard({ post, readOnly, onToggleLike, onPressAuthor }: MediaCardProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const [mediaHeight, setMediaHeight] = useState(width);
  const mediaHeightSet = useRef(false);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) setActiveIndex(index);
  }

  function handleNaturalSize(natW: number, natH: number) {
    if (mediaHeightSet.current || natW === 0) return;
    mediaHeightSet.current = true;
    setMediaHeight(Math.min(width, Math.round((width / natW) * natH)));
  }

  return (
    <View className="bg-surface">
      {carouselIndex !== null && (
        <MediaCarousel
          mediaIds={post.mediaIds}
          initialIndex={carouselIndex}
          onClose={() => setCarouselIndex(null)}
        />
      )}

      {/* Author header */}
      {onPressAuthor ? (
        <Pressable
          className="flex-row items-center gap-2.5 px-3 py-2.5"
          onPress={onPressAuthor}
          hitSlop={6}
        >
          <Avatar
            name={post.authorName}
            size={32}
            source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : undefined}
          />
          <View className="min-w-0 flex-1">
            <Text className="text-[14px] font-semibold text-foreground">{post.authorName}</Text>
          </View>
        </Pressable>
      ) : (
        <View className="flex-row items-center gap-2.5 px-3 py-2.5">
          <Avatar
            name={post.authorName}
            size={32}
            source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : undefined}
          />
          <View className="min-w-0 flex-1">
            <Text className="text-[14px] font-semibold text-foreground">{post.authorName}</Text>
            <Text className="text-[12px] text-muted-foreground">
              {formatRelativeTime(post.creationTime)}
            </Text>
          </View>
        </View>
      )}

      {/* Media swiper */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleScroll}
        scrollEnabled={post.mediaIds.length > 1}
      >
        {post.mediaIds.map((mediaId, index) => (
          <MediaItem
            key={`${post.id}-${index}`}
            mediaId={mediaId}
            width={width}
            height={mediaHeight}
            isActive={index === activeIndex}
            onPress={() => setCarouselIndex(index)}
            onNaturalSize={index === 0 ? handleNaturalSize : undefined}
          />
        ))}
      </Animated.ScrollView>

      {/* Dot indicators */}
      <Dots count={post.mediaIds.length} scrollX={scrollX} slideWidth={width} />

      {/* Actions */}
      <PostActions
        post={post}
        readOnly={readOnly}
        onToggleLike={onToggleLike}
        className={post.mediaIds.length > 1 ? 'px-3 pt-0' : 'px-3 pt-2'}
        likeIconSize={24}
        commentIconSize={22}
      />

      {/* Caption */}
      <View className="px-3 pb-3 pt-1.5">
        {post.caption ? (
          <Text className="text-[14px] leading-5 text-foreground">
            <Text className="font-semibold">{post.authorName} </Text>
            {post.caption}
          </Text>
        ) : (
          <View className="pb-3" />
        )}

        <Text className="text-[12px] text-muted-foreground">
          {formatRelativeTime(post.creationTime)}
        </Text>
      </View>

      {/* Divider */}
      <View className="h-px bg-border my-2.5" />
    </View>
  );
}
