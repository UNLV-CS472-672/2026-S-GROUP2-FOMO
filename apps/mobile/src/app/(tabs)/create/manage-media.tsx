import { Icon } from '@/components/icon';
import { Dots } from '@/components/ui/dots';
import { Screen } from '@/components/ui/screen';
import { VideoThumbnail } from '@/components/video/video-thumbnail';
import { useCreateContext } from '@/features/create/context';
import type { CreateMediaItem } from '@/features/create/types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MediaRow = CreateMediaItem & { key: string };

function PreviewCarousel({
  items,
  activeIndex,
  onChangeIndex,
}: {
  items: MediaRow[];
  activeIndex: number;
  onChangeIndex: (i: number) => void;
}) {
  const { width } = useWindowDimensions();
  const previewHeight = width * 0.75;
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({
      x: activeIndex * width,
      animated: true,
    });
  }, [activeIndex, width]);

  return (
    <View>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== activeIndex) onChangeIndex(i);
        }}
        scrollEnabled={items.length > 1}
      >
        {items.map((item) => {
          const isVideo = item.type === 'video';

          return (
            <View
              key={item.key}
              className="items-center justify-center bg-black"
              style={{ width, height: previewHeight }}
            >
              {isVideo ? (
                <View className="h-full w-full">
                  <VideoThumbnail
                    uri={item.uri}
                    className="h-full w-full"
                    maxWidth={width}
                    maxHeight={previewHeight}
                    fallbackClassName="h-full w-full bg-zinc-900"
                  />
                  <View className="pointer-events-none absolute inset-0 items-center justify-center">
                    <View className="rounded-full bg-black/40 p-2">
                      <Icon name="play-arrow" size={24} className="text-white" />
                    </View>
                  </View>
                </View>
              ) : (
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                />
              )}
            </View>
          );
        })}
      </Animated.ScrollView>

      {items.length > 1 && <Dots count={items.length} scrollX={scrollX} slideWidth={width} />}
    </View>
  );
}

export default function ManageMediaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { control, removePostMedia, replacePostMedia } = useCreateContext();
  const currentPostMedia = useWatch({ control, name: 'post.media' }) as
    | CreateMediaItem[]
    | undefined;

  // Stable key assignment: each unique (uri, occurrence-index) gets a persistent id so
  // DraggableFlatList can animate across context re-renders without key churn.
  const keyCounterRef = useRef(0);
  const keyMapRef = useRef(new Map<string, string>());

  const items = useMemo<MediaRow[]>(() => {
    const seen = new Map<string, number>();
    return (currentPostMedia ?? []).map((item) => {
      const n = seen.get(item.uri) ?? 0;
      seen.set(item.uri, n + 1);
      const slot = `${item.uri}::${n}`;
      if (!keyMapRef.current.has(slot)) {
        keyMapRef.current.set(slot, String(++keyCounterRef.current));
      }
      return { ...item, key: keyMapRef.current.get(slot)! };
    });
  }, [currentPostMedia]);

  const [previewKey, setPreviewKey] = useState<string | null>(items[0]?.key ?? null);

  // Derive the active key during render — no effect needed.
  const activePreviewKey = items.some((item) => item.key === previewKey)
    ? previewKey
    : (items[0]?.key ?? null);

  const previewIndex = useMemo(() => {
    const idx = items.findIndex((item) => item.key === activePreviewKey);
    return idx >= 0 ? idx : 0;
  }, [items, activePreviewKey]);

  const handleRemove = useCallback(
    (key: string) => {
      const idx = items.findIndex((item) => item.key === key);
      if (idx < 0) return;
      setPreviewKey((prev) => {
        if (prev !== key) return prev;
        const fallback = items[Math.min(idx, items.length - 2)];
        return fallback?.key !== key ? (fallback?.key ?? null) : null;
      });
      removePostMedia(idx);
    },
    [items, removePostMedia]
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: MediaRow[] }) => {
      replacePostMedia(data.map(({ uri, type }) => ({ uri, type })));
    },
    [replacePostMedia]
  );

  const openGalleryToReplace = useCallback(
    (key: string) => {
      const replaceIdx = items.findIndex((row) => row.key === key);
      if (replaceIdx < 0) return;
      router.push({
        pathname: '/create/gallery',
        params: { mode: 'post', replaceIndex: String(replaceIdx) },
      });
    },
    [items, router]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<MediaRow>) => {
      const displayIndex = items.findIndex((row) => row.key === item.key);
      const labelIndex = displayIndex >= 0 ? displayIndex + 1 : 1;
      const isVideo = item.type === 'video';
      const isSelected = item.key === activePreviewKey;

      return (
        <ScaleDecorator activeScale={0.95}>
          <Pressable
            onLongPress={drag}
            delayLongPress={150}
            onPress={() => setPreviewKey(item.key)}
            className={`mx-4 flex-row items-center gap-3 rounded-2xl border-2 p-2 ${
              isActive ? 'border-primary/40 bg-primary/5 my-2' : 'border-transparent bg-surface'
            }`}
            style={{
              borderCurve: 'continuous',
              opacity: isActive ? 0.9 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={`Media ${labelIndex}, hold to reorder`}
          >
            <Icon
              name="drag-handle"
              size={24}
              className={isActive ? 'text-primary' : 'text-muted-foreground/50'}
            />

            <View
              className={`min-h-7 min-w-7 items-center justify-center rounded-full px-1 ${
                isSelected ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isSelected ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {labelIndex}
              </Text>
            </View>

            <View
              className="overflow-hidden rounded-xl bg-muted"
              style={{ width: 64, height: 64, borderCurve: 'continuous' }}
            >
              {isVideo ? (
                <View className="h-full w-full">
                  <VideoThumbnail
                    uri={item.uri}
                    className="h-full w-full"
                    maxWidth={160}
                    maxHeight={160}
                    fallbackClassName="h-full w-full bg-zinc-900"
                  />
                  <View className="pointer-events-none absolute bottom-0.5 left-0.5">
                    <Icon name="videocam" size={12} className="text-white" />
                  </View>
                </View>
              ) : (
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              )}
            </View>

            <View className="flex-1" />

            <Pressable
              onPress={() => openGalleryToReplace(item.key)}
              hitSlop={6}
              className="h-10 w-10 items-center justify-center rounded-full bg-primary/10"
              accessibilityRole="button"
              accessibilityLabel={`Replace media ${labelIndex} from library`}
            >
              <Icon name="photo-library" size={20} className="text-primary" />
            </Pressable>

            <Pressable
              onPress={() => handleRemove(item.key)}
              hitSlop={6}
              className="h-10 w-10 items-center justify-center rounded-full bg-destructive/10"
              accessibilityRole="button"
              accessibilityLabel={`Remove media ${labelIndex}`}
            >
              <Icon name="close" size={20} className="text-destructive" />
            </Pressable>
          </Pressable>
        </ScaleDecorator>
      );
    },
    [handleRemove, openGalleryToReplace, items, activePreviewKey]
  );

  const handleChangePreviewIndex = useCallback(
    (i: number) => {
      setPreviewKey(items[i]?.key ?? null);
    },
    [items]
  );

  const openGalleryToAdd = useCallback(() => {
    router.push({
      pathname: '/create/gallery',
      params: { mode: 'post', returnTo: 'manage-media' },
    });
  }, [router]);

  return (
    <Screen className="flex-1">
      <View className="flex-1" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
        {items.length > 0 && (
          <PreviewCarousel
            items={items}
            activeIndex={previewIndex}
            onChangeIndex={handleChangePreviewIndex}
          />
        )}

        <DraggableFlatList
          data={items}
          keyExtractor={(item) => item.key}
          activationDistance={10}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 12,
            rowGap: 12,
            paddingBottom: 72,
          }}
          onDragEnd={handleDragEnd}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="items-center justify-center px-8 py-16">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Icon name="image" size={24} className="text-muted-foreground" />
              </View>
              <Text className="text-center text-base font-semibold text-foreground">
                No media yet
              </Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Go back to add photos or videos.
              </Text>
            </View>
          }
        />

        <Pressable
          onPress={openGalleryToAdd}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Add more media from library"
          className="absolute right-5 size-12 items-center justify-center rounded-full bg-card shadow-sm"
          style={({ pressed }) => [
            { bottom: Math.max(insets.bottom, 8) + 12 },
            pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
          ]}
        >
          <Icon name="add-photo-alternate" size={22} className="text-primary" />
        </Pressable>
      </View>
    </Screen>
  );
}
