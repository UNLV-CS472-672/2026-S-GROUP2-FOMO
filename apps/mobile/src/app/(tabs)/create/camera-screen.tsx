import { useIsFocused } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CameraButton from '@/components/ui/camera-button';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCapturedUri, setLastCapturedUri] = useState<string | null>(null);
  const [latestGalleryUri, setLatestGalleryUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { push } = useRouter();

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

  const loadLatestGalleryAsset = useCallback(async () => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: 1,
        mediaType: [MediaLibrary.MediaType.photo],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const latestAsset = result.assets[0];
      if (!latestAsset) {
        setLatestGalleryUri(null);
        return;
      }

      setLatestGalleryUri(latestAsset.uri);
    } catch {
      setLatestGalleryUri(null);
    }
  }, []);

  const handleTakePicture = useCallback(async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing) {
      return;
    }

    setErrorMessage(null);
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        setLastCapturedUri(photo.uri);
        setLatestGalleryUri(photo.uri);

        const hasMediaAccess = await ensureMediaPermission();
        if (hasMediaAccess) {
          await MediaLibrary.createAssetAsync(photo.uri);
          void loadLatestGalleryAsset();
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to capture photo.';
      setErrorMessage(message);
    } finally {
      setIsCapturing(false);
    }
  }, [ensureMediaPermission, isCameraReady, isCapturing, loadLatestGalleryAsset]);

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const handleOpenGallery = useCallback(async () => {
    push('/create/gallery-screen');
  }, [push]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const ensureMediaAccess = async () => {
      const hasAccess = await ensureMediaPermission();
      if (hasAccess) {
        await loadLatestGalleryAsset();
      }
    };

    void ensureMediaAccess();
  }, [ensureMediaPermission, isFocused, loadLatestGalleryAsset]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View className="flex-1 bg-app-background" />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-app-background px-6">
        <Text className="text-center text-base text-app-text">
          We need your permission to show the camera
        </Text>
        {permission.canAskAgain ? (
          <TouchableOpacity
            className="rounded-xl bg-app-tint px-4 py-2"
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text className="font-semibold text-white">Grant permission</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="rounded-xl bg-app-tint px-4 py-2"
            onPress={Linking.openSettings}
            activeOpacity={0.8}
          >
            <Text className="font-semibold text-white">Open settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        facing={facing}
        active={isFocused}
        onCameraReady={() => setIsCameraReady(true)}
        onMountError={(event) => setErrorMessage(event.message)}
      />
      <View
        className="absolute left-0 right-0 items-center gap-3 px-6"
        style={{ bottom: insets.bottom + 88 }}
      >
        {errorMessage ? (
          <Text className="rounded-lg bg-red-500/85 px-3 py-2 text-center text-xs text-white">
            {errorMessage}
          </Text>
        ) : null}
        {lastCapturedUri ? (
          <Text
            className="rounded-lg bg-black/65 px-3 py-2 text-center text-xs text-white"
            numberOfLines={1}
          >
            Captured: {lastCapturedUri}
          </Text>
        ) : null}
        <CameraButton
          onCapture={handleTakePicture}
          onFlip={toggleCameraFacing}
          onOpenGallery={handleOpenGallery}
          galleryPreviewUri={latestGalleryUri}
          disabled={!isCameraReady}
          isCapturing={isCapturing}
        />
      </View>
    </View>
  );
}
