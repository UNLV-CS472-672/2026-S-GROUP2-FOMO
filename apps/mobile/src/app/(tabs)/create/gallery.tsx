import { Icon } from '@/components/icon';
import { Screen } from '@/components/ui/screen';
import { VideoThumbnail } from '@/components/video/video-thumbnail';
import { useCreateContext } from '@/features/create/context';
import { useAppTheme } from '@/lib/use-app-theme';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type GalleryParams = {
  mode?: string | string[];
  /** When set, picking an asset returns to manage-media and replaces this index (no JSON payload). */
  replaceIndex?: string | string[];
};

type GalleryAsset = MediaLibrary.Asset;

const PAGE_SIZE = 60;

const POST_GALLERY_MEDIA_TYPES: MediaLibrary.MediaTypeValue[] = [
  MediaLibrary.MediaType.photo,
  MediaLibrary.MediaType.video,
];

const EVENT_GALLERY_MEDIA_TYPES: MediaLibrary.MediaTypeValue[] = [MediaLibrary.MediaType.photo];

function isVideoAsset(asset: MediaLibrary.Asset) {
  return asset.mediaType === MediaLibrary.MediaType.video;
}

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function isLibraryAccessGranted(response: MediaLibrary.PermissionResponse) {
  return response.granted || response.status === MediaLibrary.PermissionStatus.GRANTED;
}

export default function CreateGalleryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<GalleryParams>();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { control, replacePostMedia } = useCreateContext();
  const currentPostMedia = useWatch({ control, name: 'post.media' });

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [mustOpenSettings, setMustOpenSettings] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  const assetsLenRef = useRef(0);
  assetsLenRef.current = assets.length;

  const initialPermissionPassDone = useRef(false);

  const mode = useMemo(() => {
    return getStringParam(params.mode) === 'event' ? 'event' : 'post';
  }, [params.mode]);

  const replaceIndex = useMemo(() => getStringParam(params.replaceIndex), [params.replaceIndex]);
  const isReplaceFlow = mode === 'post' && replaceIndex != null && replaceIndex !== '';

  const mediaTypesForQuery = useMemo(
    () => (mode === 'event' ? EVENT_GALLERY_MEDIA_TYPES : POST_GALLERY_MEDIA_TYPES),
    [mode]
  );

  /** Android 13+ read scope; ignored on iOS by expo-media-library. */
  const readGranular = useMemo((): MediaLibrary.GranularPermission[] | undefined => {
    if (Platform.OS !== 'android') return undefined;
    return mode === 'event' ? ['photo'] : ['photo', 'video'];
  }, [mode]);

  const getReadPermission = useCallback(async () => {
    return MediaLibrary.getPermissionsAsync(false, readGranular);
  }, [readGranular]);

  const loadPage = useCallback(
    async (after?: string) => {
      const perm = await getReadPermission();
      if (!isLibraryAccessGranted(perm)) {
        setPermissionGranted(false);
        setMustOpenSettings(!perm.canAskAgain);
        if (!after) {
          setAssets([]);
          setEndCursor(null);
          setHasNextPage(false);
        }
        setIsLoadingAssets(false);
        return;
      }
      setPermissionGranted(true);
      setMustOpenSettings(false);

      setIsLoadingAssets(true);
      try {
        const page = await MediaLibrary.getAssetsAsync({
          first: PAGE_SIZE,
          after,
          mediaType: mediaTypesForQuery,
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
      } finally {
        setIsLoadingAssets(false);
      }
    },
    [getReadPermission, mediaTypesForQuery]
  );

  const requestLibraryAccess = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      let next = await getReadPermission();
      if (isLibraryAccessGranted(next)) {
        setPermissionGranted(true);
        setMustOpenSettings(false);
        await loadPage();
        return;
      }
      if (next.canAskAgain) {
        next = await MediaLibrary.requestPermissionsAsync(false, readGranular);
      } else {
        await Linking.openSettings();
        next = await getReadPermission();
      }
      const granted = isLibraryAccessGranted(next);
      setPermissionGranted(granted);
      setMustOpenSettings(!granted && !next.canAskAgain);
      if (granted) {
        await loadPage();
      }
    } finally {
      setIsRequestingPermission(false);
    }
  }, [getReadPermission, loadPage, readGranular]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const sync = async () => {
        if (!initialPermissionPassDone.current) {
          setIsCheckingPermission(true);
        }
        const perm = await getReadPermission();
        if (cancelled) return;

        const granted = isLibraryAccessGranted(perm);
        setMustOpenSettings(!granted && !perm.canAskAgain);

        if (!granted) {
          setPermissionGranted(false);
          setAssets([]);
          setEndCursor(null);
          setHasNextPage(false);
        } else {
          setPermissionGranted(true);
          if (assetsLenRef.current === 0) {
            await loadPage();
          }
        }

        if (!initialPermissionPassDone.current) {
          initialPermissionPassDone.current = true;
          setIsCheckingPermission(false);
        }
      };

      void sync();

      return () => {
        cancelled = true;
      };
    }, [getReadPermission, loadPage])
  );

  const handleSelectAsset = async (asset: GalleryAsset) => {
    const info = await MediaLibrary.getAssetInfoAsync(asset.id);
    const mediaUri = info.localUri ?? asset.uri;
    const mediaType = isVideoAsset(asset) ? 'video' : 'photo';

    if (isReplaceFlow) {
      const idx = parseInt(replaceIndex!, 10);
      if (!Number.isNaN(idx) && idx >= 0) {
        const next = Array.isArray(currentPostMedia) ? [...currentPostMedia] : [];
        next[idx] = { uri: mediaUri, type: mediaType };
        replacePostMedia(next);
      }
      router.back();
      return;
    }

    router.push({
      pathname: '/create/media-preview' as never,
      params: { mode, mediaUri, mediaType } as never,
    });
  };

  const handleLoadMore = () => {
    if (isLoadingAssets || !hasNextPage || !endCursor) return;
    void loadPage(endCursor);
  };

  if (isCheckingPermission) {
    return (
      <Screen className="flex-1 items-center justify-center">
        <ActivityIndicator color={theme.tint} />
      </Screen>
    );
  }

  if (!permissionGranted) {
    return (
      <Screen className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="text-center text-[28px] font-bold text-foreground">
          Gallery access needed
        </Text>
        <Text className="text-center text-base leading-6 text-muted-foreground">
          {mode === 'event'
            ? 'Allow access to your photo library so you can pick a cover image from your device.'
            : 'Allow access to your library so you can pick photos and videos from your device.'}
        </Text>
        <Pressable
          className="mt-2 min-h-[48px] flex-row items-center justify-center gap-2 rounded-full bg-primary px-5 py-3"
          disabled={isRequestingPermission}
          onPress={() => {
            void requestLibraryAccess();
          }}
        >
          {isRequestingPermission ? <ActivityIndicator color={theme.tintForeground} /> : null}
          <Text className="font-semibold text-primary-foreground">
            {mustOpenSettings ? 'Open Settings' : 'Allow Library Access'}
          </Text>
        </Pressable>
        {mustOpenSettings ? (
          <Text className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Photo access was turned off for this app. Open Settings, enable Photos, then return
            here.
          </Text>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen className="flex-1">
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{
          paddingHorizontal: 6,
          paddingBottom: Math.max(insets.bottom, 20),
        }}
        columnWrapperStyle={{ gap: 6 }}
        onEndReachedThreshold={0.5}
        onEndReached={handleLoadMore}
        ListEmptyComponent={
          <View className="items-center justify-center px-6 py-12">
            <Text className="text-center text-base text-muted-foreground">
              {mode === 'event'
                ? 'No photos found in your gallery.'
                : 'No photos or videos found in your gallery.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isVideo = isVideoAsset(item);
          return (
            <Pressable
              className="mb-1.5 flex-1 overflow-hidden rounded-lg border border-border"
              style={{ aspectRatio: 1 }}
              onPress={() => {
                void handleSelectAsset(item);
              }}
            >
              {isVideo ? (
                <View className="h-full w-full">
                  <VideoThumbnail
                    uri={item.uri}
                    className="h-full w-full"
                    maxWidth={360}
                    maxHeight={360}
                    fallbackClassName="h-full w-full bg-muted"
                  />
                  <View className="pointer-events-none absolute inset-0 items-center justify-center">
                    <View className="rounded-full bg-card/85 p-2">
                      <Icon name="play-arrow" size={28} className="text-card-foreground" />
                    </View>
                  </View>
                </View>
              ) : (
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              )}
            </Pressable>
          );
        }}
        ListFooterComponent={
          isLoadingAssets && assets.length > 0 ? (
            <View className="py-4">
              <ActivityIndicator color={theme.tint} />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
