import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GalleryParams = {
  mode?: string | string[];
};

type PhotoAsset = MediaLibrary.Asset;

const PAGE_SIZE = 60;

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function CreateGalleryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<GalleryParams>();

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assets, setAssets] = useState<PhotoAsset[]>([]);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  const mode = useMemo(() => {
    return getStringParam(params.mode) === 'event' ? 'event' : 'post';
  }, [params.mode]);

  const ensurePermission = useCallback(async () => {
    setIsCheckingPermission(true);
    const current = await MediaLibrary.getPermissionsAsync();
    const next = current.granted ? current : await MediaLibrary.requestPermissionsAsync();
    setPermissionGranted(next.granted);
    setIsCheckingPermission(false);
    return next.granted;
  }, []);

  const loadPage = useCallback(async (after?: string) => {
    setIsLoadingAssets(true);

    const page = await MediaLibrary.getAssetsAsync({
      first: PAGE_SIZE,
      after,
      mediaType: MediaLibrary.MediaType.photo,
      sortBy: [MediaLibrary.SortBy.creationTime],
    });

    if (after) {
      setAssets((prev) => {
        const seen = new Set(prev.map((asset) => asset.id));
        const nextItems = page.assets.filter((asset) => !seen.has(asset.id));
        return [...prev, ...nextItems];
      });
    } else {
      setAssets(page.assets);
    }

    setEndCursor(page.endCursor ?? null);
    setHasNextPage(page.hasNextPage);
    setIsLoadingAssets(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const granted = await ensurePermission();
      if (!isMounted || !granted) return;
      await loadPage();
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [ensurePermission, loadPage]);

  const handleSelectAsset = async (asset: PhotoAsset) => {
    const info = await MediaLibrary.getAssetInfoAsync(asset.id);
    const mediaUri = info.localUri ?? asset.uri;

    router.push({
      pathname: '/create/media-preview' as never,
      params: {
        mode,
        mediaUri,
        mediaType: 'photo',
      } as never,
    });
  };

  const handleLoadMore = () => {
    if (isLoadingAssets || !hasNextPage || !endCursor) return;
    void loadPage(endCursor);
  };

  if (isCheckingPermission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#090909]">
        <ActivityIndicator color="#fff" />
      </SafeAreaView>
    );
  }

  if (!permissionGranted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-[#090909] px-6">
        <Text className="text-center text-[28px] font-bold text-white">Gallery access needed</Text>
        <Text className="text-center text-base leading-6 text-zinc-300">
          Allow photo access so you can pick images from your device.
        </Text>
        <Pressable
          className="mt-2 rounded-full border border-white/30 bg-zinc-800 px-5 py-3"
          onPress={() => {
            void ensurePermission().then((granted) => {
              if (granted) {
                void loadPage();
              }
            });
          }}
        >
          <Text className="font-semibold text-white">Allow Photo Access</Text>
        </Pressable>
        <Pressable className="rounded-full px-5 py-3" onPress={() => router.back()}>
          <Text className="font-semibold text-zinc-300">Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#090909]">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          className="rounded-full border border-white/30 px-3 py-2"
          onPress={() => router.back()}
        >
          <Text className="font-semibold text-white">Back</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-white">Gallery</Text>
        <View style={{ width: 54 }} />
      </View>

      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 20 }}
        columnWrapperStyle={{ gap: 6 }}
        onEndReachedThreshold={0.5}
        onEndReached={handleLoadMore}
        ListEmptyComponent={
          <View className="items-center justify-center px-6 py-12">
            <Text className="text-center text-base text-zinc-300">
              No photos found in your gallery.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            className="mb-1.5 flex-1 overflow-hidden rounded-lg border border-white/10"
            style={{ aspectRatio: 1 }}
            onPress={() => {
              void handleSelectAsset(item);
            }}
          >
            <Image
              source={{ uri: item.uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </Pressable>
        )}
        ListFooterComponent={
          isLoadingAssets && assets.length > 0 ? (
            <View className="py-4">
              <ActivityIndicator color="#fff" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
