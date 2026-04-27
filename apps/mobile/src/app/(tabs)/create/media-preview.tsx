import { VideoPlayer } from '@/components/video/video-player';
import { useCreateContext } from '@/features/create/context';
import { getModeParam, getStringParam, toFileUri } from '@/features/create/utils';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PostPreviewParams = {
  mediaUri?: string | string[];
  mediaType?: 'photo' | 'video' | string | string[];
  mode?: string | string[];
};

export default function PostPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PostPreviewParams>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { setValue, handleCloseDrawer } = useCreateContext();

  const mediaUriParam = getStringParam(params.mediaUri);
  const mediaTypeParam = getStringParam(params.mediaType);

  const mediaUri = mediaUriParam ? toFileUri(mediaUriParam) : '';
  const mediaType = mediaTypeParam === 'video' ? 'video' : 'photo';
  const mode = getModeParam(params.mode);
  const mediaHeight = Math.max(260, Math.min(height * 0.62, 560));

  const handleRetake = () => {
    router.back();
  };

  const handleUseMedia = () => {
    if (!mediaUri) return;
    setValue(
      mode === 'event' ? 'event.media' : 'post.media',
      { uri: mediaUri, type: mediaType },
      { shouldDirty: true, shouldValidate: true }
    );
    handleCloseDrawer();
    router.dismissTo({ pathname: '/(tabs)/create' as never });
  };

  return (
    <View
      className="flex-1 gap-4 px-4 pt-3"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: Math.max(insets.bottom, 16) + 8,
      }}
    >
      <View
        className="overflow-hidden rounded-[20px] border border-border bg-surface"
        style={{ height: mediaHeight, maxHeight: mediaHeight }}
      >
        {mediaUri ? (
          mediaType === 'photo' ? (
            <Image
              source={{ uri: mediaUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
            />
          ) : (
            <VideoPlayer
              uri={mediaUri}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              nativeControls
              autoPlay
              muted={false}
              isActive
            />
          )
        ) : (
          <View className="flex-1 items-center justify-center gap-2.5 px-6">
            <Text className="text-center text-2xl font-bold text-foreground">No media found</Text>
            <Text className="text-center text-[15px] leading-6 text-muted-foreground">
              Capture a photo or video and try again.
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1" />

      <View className="gap-4 mb-4">
        <Pressable
          className="items-center rounded-xl border border-border bg-surface py-4"
          onPress={handleRetake}
        >
          <Text className="text-[15px] font-semibold text-foreground">Retake</Text>
        </Pressable>
        <Pressable className="items-center rounded-xl bg-primary py-4" onPress={handleUseMedia}>
          <Text className="text-[15px] font-bold text-primary-foreground">
            Use this {mediaType}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
