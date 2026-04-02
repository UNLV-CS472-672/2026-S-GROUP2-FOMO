import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Linking, Text, TouchableOpacity, View } from 'react-native';

type GalleryItem = {
  id: string;
  uri: string;
};

export default function GalleryScreen() {
  const [assets, setAssets] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ensureMediaPermission = useCallback(async () => {
    const current = await MediaLibrary.getPermissionsAsync();
    if (current.granted) {
      return true;
    }

    if (!current.canAskAgain) {
      return false;
    }

    const requested = await MediaLibrary.requestPermissionsAsync();
    return requested.granted;
  }, []);

  const loadAllPhotos = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const hasAccess = await ensureMediaPermission();
      if (!hasAccess) {
        setPermissionBlocked(true);
        setAssets([]);
        return;
      }

      setPermissionBlocked(false);

      const loadedAssets: MediaLibrary.Asset[] = [];
      let after: string | undefined;
      let hasNextPage = true;

      while (hasNextPage) {
        const page = await MediaLibrary.getAssetsAsync({
          first: 100,
          after,
          mediaType: [MediaLibrary.MediaType.photo],
          sortBy: [MediaLibrary.SortBy.creationTime],
          resolveWithFullInfo: true,
        });

        loadedAssets.push(...page.assets);
        hasNextPage = page.hasNextPage;
        after = page.endCursor;
      }

      const resolved = loadedAssets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
      }));

      setAssets(resolved);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load photos.';
      setErrorMessage(message);
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [ensureMediaPermission]);

  useEffect(() => {
    void loadAllPhotos();
  }, [loadAllPhotos]);

  if (permissionBlocked) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-app-background px-6">
        <Text className="text-center text-base text-app-text">
          Photo access is required to show your gallery.
        </Text>
        <TouchableOpacity
          className="rounded-xl bg-app-tint px-4 py-2"
          onPress={Linking.openSettings}
          activeOpacity={0.85}
        >
          <Text className="font-semibold text-white">Open settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-background px-4 pt-4">
      {errorMessage ? (
        <Text className="mb-3 rounded-lg bg-red-500/85 px-3 py-2 text-center text-xs text-white">
          {errorMessage}
        </Text>
      ) : null}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-app-text">Loading photos...</Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className="aspect-square flex-1 overflow-hidden rounded-xl bg-black/10">
              <Image source={{ uri: item.uri }} className="h-full w-full" resizeMode="cover" />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-app-text">No photos found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
