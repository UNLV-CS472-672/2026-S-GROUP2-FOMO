import { CaptureTypeToggle } from '@/features/create/components/camera/capture-type-toggle';
import { ShutterButton } from '@/features/create/components/camera/shutter-button';
import { LatestGalleryImage } from '@/features/create/components/latest-gallery-image';
import { useCapture } from '@/features/create/hooks/use-capture';
import type { CreateMode } from '@/features/create/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, type CameraPermissionStatus, useCameraDevice } from 'react-native-vision-camera';

type CreateCameraCaptureViewProps = {
  mode: CreateMode;
  isActive: boolean;
  onRequestClose: () => void;
};

export function CreateCameraCaptureView({
  mode,
  isActive,
  onRequestClose,
}: CreateCameraCaptureViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);

  const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>(() =>
    Camera.getCameraPermissionStatus()
  );
  const [isRequestingCameraPermission, setIsRequestingCameraPermission] = useState(false);

  const refreshCameraPermission = useCallback(() => {
    setCameraPermission(Camera.getCameraPermissionStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshCameraPermission();
    }, [refreshCameraPermission])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshCameraPermission();
      }
    });
    return () => sub.remove();
  }, [refreshCameraPermission]);

  const hasPermission = cameraPermission === 'granted';
  const mustOpenSettingsForCamera =
    cameraPermission === 'denied' || cameraPermission === 'restricted';

  const requestCameraAccess = useCallback(async () => {
    setIsRequestingCameraPermission(true);
    try {
      const status = Camera.getCameraPermissionStatus();
      if (status === 'granted') {
        refreshCameraPermission();
        return;
      }
      if (status === 'not-determined') {
        await Camera.requestCameraPermission();
        refreshCameraPermission();
        return;
      }
      await Linking.openSettings();
      refreshCameraPermission();
    } finally {
      setIsRequestingCameraPermission(false);
    }
  }, [refreshCameraPermission]);

  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const device = useCameraDevice(cameraFacing);

  const openPreview = (mediaUri: string, mediaType: 'photo' | 'video') => {
    router.push({
      pathname: '/create/media-preview',
      params: { mediaUri, mediaType, mode },
    });
  };

  const { captureType, setCaptureType, isBusy, isRecording, handleCapture, isEventFlow } =
    useCapture({ mode, cameraRef, device, flash, onPreview: openPreview });

  if (!hasPermission) {
    return (
      <View className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-center text-[28px] font-bold text-white">Camera access needed</Text>
          <Text className="text-center text-base leading-5.5 text-white/80">
            Enable camera permission to capture photos and videos.
          </Text>
          <Pressable
            className="mt-2 min-h-[48px] flex-row items-center justify-center gap-2 rounded-full border border-white/40 px-4.5 py-2.5"
            disabled={isRequestingCameraPermission}
            onPress={() => {
              void requestCameraAccess();
            }}
          >
            {isRequestingCameraPermission ? <ActivityIndicator color="#fff" /> : null}
            <Text className="font-semibold text-white">
              {mustOpenSettingsForCamera ? 'Open Settings' : 'Allow Camera Access'}
            </Text>
          </Pressable>
          {mustOpenSettingsForCamera ? (
            <Text className="mt-1 max-w-sm text-center text-sm text-white/70">
              Camera access is off for this app. Open Settings, enable Camera, then return here.
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {device && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          photo
          video
          audio
        />
      )}

      <SafeAreaView style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between p-3.5">
          <Pressable onPress={onRequestClose} hitSlop={12} className="rounded-full bg-black/50 p-2">
            <Ionicons name="close" size={22} color="white" />
          </Pressable>
          <Pressable
            hitSlop={8}
            className="rounded-full bg-black/50 p-2"
            onPress={() => setFlash((v) => (v === 'off' ? 'on' : 'off'))}
          >
            <Ionicons
              name={flash === 'on' ? 'flash' : 'flash-off'}
              size={22}
              color={flash === 'on' ? '#facc15' : 'white'}
            />
          </Pressable>
        </View>

        {/* Bottom controls */}
        <View className="absolute left-0 right-0 gap-4.5" style={{ bottom: insets.bottom + 28 }}>
          {/* only allow photo capture for events */}
          {!isEventFlow && (
            <CaptureTypeToggle
              captureType={captureType}
              onChange={setCaptureType}
              disabled={isRecording}
            />
          )}

          <View className="flex-row items-center justify-between px-7">
            <LatestGalleryImage
              onPress={() =>
                router.push({
                  pathname: '/create/gallery',
                  params: { mode },
                })
              }
            />
            <ShutterButton
              captureType={captureType}
              isRecording={isRecording}
              isBusy={isBusy}
              onPress={handleCapture}
            />
            <Pressable
              hitSlop={8}
              className="rounded-full bg-black/50 p-2.5"
              onPress={() => setCameraFacing((v) => (v === 'back' ? 'front' : 'back'))}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="white" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
