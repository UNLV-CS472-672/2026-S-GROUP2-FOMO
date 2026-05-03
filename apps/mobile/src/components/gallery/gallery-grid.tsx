import { Icon } from '@/components/icon';
import { Screen } from '@/components/ui/screen';
import { VideoThumbnail } from '@/components/video/video-thumbnail';
import { useAppTheme } from '@/lib/use-app-theme';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useMemo, useRef, useState } from 'react';
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

type GalleryAsset = MediaLibrary.Asset;

type GalleryGridProps = {
  mediaTypes?: MediaLibrary.MediaTypeValue[];
  onSelectAsset: (uri: string, type: 'photo' | 'video', fileName?: string) => void;
  emptyMessage?: string;
  permissionDescription?: string;
};

const PAGE_SIZE = 60;

function isVideoAsset(asset: MediaLibrary.Asset) {
  return asset.mediaType === MediaLibrary.MediaType.video;
}

function isLibraryAccessGranted(response: MediaLibrary.PermissionResponse) {
  return response.granted || response.status === MediaLibrary.PermissionStatus.GRANTED;
}

function canPromptForLibraryAccess(response: MediaLibrary.PermissionResponse) {
  return response.canAskAgain || response.status === MediaLibrary.PermissionStatus.UNDETERMINED;
}

export function GalleryGrid({
  mediaTypes = [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
  onSelectAsset,
  emptyMessage,
  permissionDescription = 'Allow access to your library so you can pick photos and videos from your device.',
}: GalleryGridProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

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

  const readGranular = useMemo((): MediaLibrary.GranularPermission[] | undefined => {
    if (Platform.OS !== 'android') return undefined;
    const hasVideo = mediaTypes.includes(MediaLibrary.MediaType.video);
    return hasVideo ? ['photo', 'video'] : ['photo'];
  }, [mediaTypes]);

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
          mediaType: mediaTypes,
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
    [getReadPermission, mediaTypes]
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

        let perm = await getReadPermission();
        if (cancelled) return;

        if (
          !initialPermissionPassDone.current &&
          !isLibraryAccessGranted(perm) &&
          canPromptForLibraryAccess(perm)
        ) {
          setIsRequestingPermission(true);
          try {
            perm = await MediaLibrary.requestPermissionsAsync(false, readGranular);
          } finally {
            if (!cancelled) {
              setIsRequestingPermission(false);
            }
          }
          if (cancelled) return;
        }

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
    }, [getReadPermission, loadPage, readGranular])
  );

  const handleSelectAsset = async (asset: GalleryAsset) => {
    const info = await MediaLibrary.getAssetInfoAsync(asset.id);
    const uri = info.localUri ?? asset.uri;
    const type = isVideoAsset(asset) ? 'video' : 'photo';
    onSelectAsset(uri, type, asset.filename);
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
          {permissionDescription}
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
            {mustOpenSettings ? 'Open Settings' : 'Continue'}
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
              {emptyMessage ?? 'No photos or videos found in your gallery.'}
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
