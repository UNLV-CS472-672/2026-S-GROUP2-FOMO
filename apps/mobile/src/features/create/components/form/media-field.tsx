import { Icon } from '@/components/icon';
import { MediaMosaic } from '@/components/media/media-mosaic';
import { VideoThumbnail } from '@/components/video/video-thumbnail';
import type { CreateMediaItem, CreateMode } from '@/features/create/types';
import { Image } from 'expo-image';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

const removePostMediaButtonStyle: ViewStyle = {
  zIndex: 2,
  elevation: 6,
};

function PostMediaTile({
  item,
  overlayLabel,
  onRemove,
}: {
  item: CreateMediaItem;
  overlayLabel?: string;
  onRemove?: () => void;
}) {
  const isVideo = item.type === 'video';
  return (
    <View
      className="flex-1 overflow-hidden rounded-2xl border border-border bg-muted"
      style={{ borderCurve: 'continuous' }}
    >
      {!isVideo ? (
        <Image
          source={{ uri: item.uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      ) : (
        <View className="h-full w-full">
          <VideoThumbnail
            uri={item.uri}
            className="h-full w-full"
            maxWidth={512}
            maxHeight={512}
            fallbackClassName="h-full w-full bg-zinc-900"
          />
          <View className="pointer-events-none absolute inset-0 items-center justify-center">
            <View className="rounded-full bg-black/50 p-2">
              <Icon name="play-arrow" size={28} className="text-white" />
            </View>
          </View>
        </View>
      )}

      {overlayLabel ? (
        <View className="absolute inset-0 items-center justify-center bg-black/55">
          <Text className="text-[22px] font-bold text-white">{overlayLabel}</Text>
        </View>
      ) : null}

      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={removePostMediaButtonStyle}
          className="absolute right-1.5 top-1.5 items-center justify-center rounded-full bg-background/80 p-1.5"
          accessibilityRole="button"
          accessibilityLabel="Remove media"
        >
          <Icon name="close" size={14} className="text-foreground" />
        </Pressable>
      ) : null}
    </View>
  );
}

function PostMediaPreviewGrid({
  items,
  onRemoveAtIndex,
}: {
  items: CreateMediaItem[];
  onRemoveAtIndex?: (index: number) => void;
}) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    const item = items[0]!;
    const isVideo = item.type === 'video';
    return (
      <View className="flex-1" pointerEvents="box-none">
        {!isVideo ? (
          <Image
            source={{ uri: item.uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            pointerEvents="none"
          />
        ) : (
          <View className="h-full w-full" pointerEvents="none">
            <VideoThumbnail
              uri={item.uri}
              className="h-full w-full"
              maxWidth={720}
              maxHeight={720}
              fallbackClassName="h-full w-full bg-zinc-900"
            />
            <View className="pointer-events-none absolute inset-0 items-center justify-center">
              <View className="rounded-full bg-black/50 p-3">
                <Icon name="play-arrow" size={40} className="text-white" />
              </View>
            </View>
          </View>
        )}

        {onRemoveAtIndex ? (
          <Pressable
            onPress={() => onRemoveAtIndex(0)}
            hitSlop={10}
            style={removePostMediaButtonStyle}
            className="absolute right-3 top-3 items-center justify-center rounded-full bg-background/80 p-2"
            accessibilityRole="button"
            accessibilityLabel="Remove media"
          >
            <Icon name="close" size={16} className="text-foreground" />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <MediaMosaic
      items={items}
      className="flex-1 p-2"
      renderItem={({ item, index, overlayLabel }) => (
        <PostMediaTile
          item={item}
          overlayLabel={overlayLabel}
          onRemove={onRemoveAtIndex ? () => onRemoveAtIndex(index) : undefined}
        />
      )}
    />
  );
}

type MediaFieldProps = {
  mode: CreateMode;
  media: CreateMediaItem | CreateMediaItem[];
  mediaHeight: number;
  openCamera: () => void;
  openManage?: () => void;
  clearMedia: () => void;
  removePostMediaAtIndex?: (index: number) => void;
  errorMessage?: string;
};

export function MediaField({
  mode,
  media,
  mediaHeight,
  openCamera,
  openManage,
  clearMedia,
  removePostMediaAtIndex,
  errorMessage,
}: MediaFieldProps) {
  const isEventMode = mode === 'event';
  const postItems = Array.isArray(media) ? media : [];
  const eventItem = !Array.isArray(media) ? media : { uri: '', type: undefined };
  const hasEventPhoto = !!eventItem.uri && eventItem.type !== 'video';
  const hasError = !!errorMessage;

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">MEDIA</Text>
        {!isEventMode && postItems.length > 0 ? (
          <Pressable
            onPress={openCamera}
            className="flex-row items-center gap-1"
            accessibilityRole="button"
            accessibilityLabel="Add more media"
          >
            <Icon name="add" size={16} className="text-muted-foreground" />
            <Text className="text-[13px] font-semibold text-muted-foreground">Add more</Text>
          </Pressable>
        ) : null}
      </View>
      {isEventMode ? (
        <Pressable
          onPress={hasEventPhoto ? undefined : openCamera}
          className="rounded-2xl shadow-md"
        >
          <View
            className={`overflow-hidden rounded-2xl border bg-surface ${hasError ? 'border-destructive' : 'border-muted'}`}
            style={{ height: mediaHeight, borderCurve: 'continuous' }}
          >
            {hasEventPhoto ? (
              <>
                <Image
                  source={{ uri: eventItem.uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={clearMedia}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Remove image"
                  className="absolute right-3 top-3 items-center justify-center rounded-full bg-background/80 p-2"
                >
                  <Icon name="close" size={16} className="text-foreground" />
                </Pressable>
              </>
            ) : (
              <View className="flex-1 items-center justify-center gap-2 p-6">
                <Text className="text-center text-[15px] font-semibold text-muted-foreground">
                  Add event cover
                </Text>
                <Text className="text-center text-[13px] leading-5 text-muted-foreground">
                  Tap to capture a cover image for the event
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      ) : (
        <View
          className={`overflow-hidden rounded-2xl border bg-surface shadow-md ${hasError ? 'border-destructive' : 'border-muted'}`}
          style={{ height: mediaHeight, borderCurve: 'continuous' }}
        >
          {postItems.length > 0 ? (
            <Pressable
              onPress={openManage}
              className="flex-1"
              accessibilityRole="button"
              accessibilityLabel="Manage media"
            >
              <PostMediaPreviewGrid items={postItems} onRemoveAtIndex={removePostMediaAtIndex} />
            </Pressable>
          ) : (
            <Pressable
              onPress={openCamera}
              className="flex-1 items-center justify-center gap-2 p-6"
            >
              <Text className="text-center text-[15px] font-semibold text-muted-foreground">
                Add photo or video
              </Text>
              <Text className="text-center text-[13px] leading-5 text-muted-foreground">
                Tap to capture something for your post
              </Text>
            </Pressable>
          )}
        </View>
      )}
      {hasError ? (
        <Text className="text-[12px] text-destructive" accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
