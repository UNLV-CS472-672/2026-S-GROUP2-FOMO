import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type PostPreviewParams = {
  mediaUri?: string | string[];
  mediaType?: 'photo' | 'video' | string | string[];
  returnTo?: string | string[];
};

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toFileUri(uri: string) {
  if (uri.startsWith('file://')) return uri;
  return `file://${uri}`;
}

export default function PostPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PostPreviewParams>();

  const mediaUriParam = getStringParam(params.mediaUri);
  const mediaTypeParam = getStringParam(params.mediaType);
  const returnToParam = getStringParam(params.returnTo);

  const mediaUri = mediaUriParam ? toFileUri(mediaUriParam) : '';
  const mediaType = mediaTypeParam === 'video' ? 'video' : 'photo';
  const returnTo = returnToParam === '/create/event' ? '/create/event' : '/create/post';

  const handleRetake = () => {
    router.replace({
      pathname: '/create/camera-screen' as never,
      params: {
        returnTo,
      } as never,
    });
  };

  const handleUseMedia = () => {
    if (!mediaUri) return;

    router.replace({
      pathname: returnTo as never,
      params: {
        mediaUri,
        mediaType,
      } as never,
    });
  };

  return (
    <View className="flex-1 gap-4 bg-[#080808] p-4">
      <View className="flex-1 overflow-hidden rounded-[20px] border border-white/15 bg-black">
        {mediaUri ? (
          <>
            {mediaType === 'photo' ? (
              <Image
                source={{ uri: mediaUri }}
                style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                contentFit="contain"
              />
            ) : (
              <View className="flex-1 items-center justify-center gap-2.5 px-6">
                <Text className="text-center text-2xl font-bold text-white">Video captured</Text>
                <Text className="text-center text-[15px] leading-6 text-zinc-300">
                  Video preview is not wired yet, but the file will be passed to the create flow.
                </Text>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-2.5 px-6">
            <Text className="text-center text-2xl font-bold text-white">No media found</Text>
            <Text className="text-center text-[15px] leading-6 text-zinc-300">
              Capture a photo or video and try again.
            </Text>
          </View>
        )}
      </View>

      <View className="gap-2.5">
        <Pressable
          className="items-center rounded-xl border border-white/25 bg-zinc-900 py-[13px]"
          onPress={handleRetake}
        >
          <Text className="text-[15px] font-semibold text-white">Retake</Text>
        </Pressable>

        <Pressable className="items-center rounded-xl bg-white py-3.5" onPress={handleUseMedia}>
          <Text className="text-[15px] font-bold text-black">Use this {mediaType}</Text>
        </Pressable>
      </View>
    </View>
  );
}
