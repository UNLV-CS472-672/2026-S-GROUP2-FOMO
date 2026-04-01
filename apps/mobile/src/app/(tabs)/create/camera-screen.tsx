import { useIsFocused } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCapturedUri, setLastCapturedUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const isFocused = useIsFocused();

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
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to capture photo.';
      setErrorMessage(message);
    } finally {
      setIsCapturing(false);
    }
  }, [isCameraReady, isCapturing]);

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

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        active={isFocused}
        onCameraReady={() => setIsCameraReady(true)}
        onMountError={(event) => setErrorMessage(event.message)}
      />
      <View className="absolute bottom-10 left-0 right-0 items-center gap-3 px-6">
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
        <TouchableOpacity
          className="rounded-full border border-white/30 bg-white/90 px-8 py-4"
          onPress={handleTakePicture}
          activeOpacity={0.85}
          disabled={!isCameraReady || isCapturing}
        >
          <Text className="font-semibold text-black">
            {isCapturing ? 'Capturing...' : 'Capture'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-full border border-white/30 bg-black/60 px-6 py-3"
          onPress={toggleCameraFacing}
          activeOpacity={0.85}
        >
          <Text className="font-semibold text-white">Flip Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
