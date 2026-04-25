import { CaptureTypeToggle } from '@/features/create/components/camera/capture-type-toggle';
import { ShutterButton } from '@/features/create/components/camera/shutter-button';
import { LatestGalleryImage } from '@/features/create/components/latest-gallery-image';
import { useCapture } from '@/features/create/hooks/use-capture';
import type { CreateMode } from '@/features/create/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

type CreateCameraCaptureViewProps = {
  mode: CreateMode;
  isActive: boolean;
  onRequestClose: () => void;
  retakeDestination?: 'back' | 'create-drawer';
};

export function CreateCameraCaptureView({
  mode,
  isActive,
  onRequestClose,
  retakeDestination = 'back',
}: CreateCameraCaptureViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const device = useCameraDevice(cameraFacing);

  const openPreview = (mediaUri: string, mediaType: 'photo' | 'video') => {
    router.push({
      pathname: '/create/media-preview' as never,
      params: { mediaUri, mediaType, mode, retakeDest: retakeDestination } as never,
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
            className="mt-2 rounded-full border border-white/40 px-4.5 py-2.5"
            onPress={requestPermission}
          >
            <Text className="font-semibold text-white">Allow Camera Access</Text>
          </Pressable>
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
                  pathname: '/create/gallery' as never,
                  params: { mode } as never,
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
