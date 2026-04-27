import { Icon } from '@/components/icon';
import type { CreateMedia, CreateMode } from '@/features/create/types';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

type MediaFieldProps = {
  mode: CreateMode;
  media: CreateMedia;
  mediaHeight: number;
  openCamera: () => void;
  clearMedia: () => void;
  errorMessage?: string;
};

export function MediaField({
  mode,
  media,
  mediaHeight,
  openCamera,
  clearMedia,
  errorMessage,
}: MediaFieldProps) {
  const isEventMode = mode === 'event';
  const hasPhoto = !!media.uri && media.type !== 'video';
  const hasError = !!errorMessage;

  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">MEDIA</Text>
      <Pressable onPress={hasPhoto ? undefined : openCamera} className="rounded-2xl shadow-md">
        <View
          className={`overflow-hidden rounded-2xl border bg-surface ${hasError ? 'border-destructive' : 'border-muted'}`}
          style={{ height: mediaHeight, borderCurve: 'continuous' }}
        >
          {hasPhoto ? (
            <>
              <Image
                source={{ uri: media.uri }}
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
                {isEventMode ? 'Add event cover' : 'Add photo or video'}
              </Text>
              <Text className="text-center text-[13px] leading-5 text-muted-foreground">
                {isEventMode
                  ? 'Tap to capture a cover image for the event'
                  : 'Tap to capture something for your post'}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      {hasError ? (
        <Text className="text-[12px] text-destructive" accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
