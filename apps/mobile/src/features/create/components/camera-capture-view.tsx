import { Screen } from '@/components/ui/screen';
import { LatestGalleryImage } from '@/features/create/components/latest-gallery-image';
import type { CreateMode } from '@/features/create/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

type CaptureType = 'photo' | 'video';
type CameraFacing = 'front' | 'back';

type CreateCameraCaptureViewProps = {
  mode: CreateMode;
  isActive: boolean;
  onRequestClose: () => void;
  showPermissionFallbackAsScreen?: boolean;
  retakeDestination?: 'back' | 'create-drawer';
};

export function CreateCameraCaptureView({
  mode,
  isActive,
  onRequestClose,
  showPermissionFallbackAsScreen = false,
  retakeDestination = 'back',
}: CreateCameraCaptureViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('back');
  const [captureType, setCaptureType] = useState<CaptureType>('photo');
  const [isBusy, setIsBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [microphonePermission, setMicrophonePermission] = useState<
    'granted' | 'denied' | 'not-determined' | 'restricted'
  >('not-determined');

  const photoTabX = useSharedValue(0);
  const photoTabW = useSharedValue(0);
  const videoTabX = useSharedValue(0);
  const videoTabW = useSharedValue(0);
  const captureTypeProgress = useSharedValue(0);

  const pillStyle = useAnimatedStyle(() => ({
    width: photoTabW.value + (videoTabW.value - photoTabW.value) * captureTypeProgress.value,
    transform: [
      {
        translateX:
          photoTabX.value + (videoTabX.value - photoTabX.value) * captureTypeProgress.value,
      },
    ],
    opacity: photoTabW.value > 0 ? 1 : 0,
  }));

  const handleSetCaptureType = (type: CaptureType) => {
    if (isRecording) return;
    setCaptureType(type);
    captureTypeProgress.value = withTiming(type === 'video' ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  };

  const device = useCameraDevice(cameraFacing);
  const isEventCaptureFlow = mode === 'event';

  useEffect(() => {
    if (isEventCaptureFlow) {
      setCaptureType('photo');
    }
  }, [isEventCaptureFlow]);

  useEffect(() => {
    setMicrophonePermission(Camera.getMicrophonePermissionStatus());
  }, []);

  const openPreview = (mediaUri: string, mediaType: CaptureType) => {
    router.push({
      pathname: '/create/media-preview' as never,
      params: {
        mediaUri,
        mediaType,
        mode,
        retakeDest: retakeDestination,
      } as never,
    });
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isBusy || !device) return;

    setIsBusy(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash,
        enableShutterSound: false,
      });
      if (photo?.path) {
        openPreview(photo.path, 'photo');
      }
    } catch {
      Alert.alert('Capture failed', 'Unable to take photo. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const startRecording = async () => {
    if (isEventCaptureFlow) {
      return;
    }

    if (!cameraRef.current || isBusy || !device) return;

    if (microphonePermission !== 'granted') {
      const status = await Camera.requestMicrophonePermission();
      setMicrophonePermission(status);
      if (status !== 'granted') {
        Alert.alert('Microphone needed', 'Enable microphone access to record video.');
        return;
      }
    }

    setIsBusy(true);
    setIsRecording(true);

    cameraRef.current.startRecording({
      flash,
      onRecordingFinished: (video) => {
        setIsRecording(false);
        setIsBusy(false);
        if (video.path) {
          openPreview(video.path, 'video');
        }
      },
      onRecordingError: () => {
        setIsRecording(false);
        setIsBusy(false);
        Alert.alert('Recording failed', 'Unable to record video. Please try again.');
      },
    });
  };

  const stopRecording = async () => {
    if (!cameraRef.current) return;
    await cameraRef.current.stopRecording();
  };

  const handleCapture = async () => {
    if (isEventCaptureFlow || captureType === 'photo') {
      await handleTakePhoto();
      return;
    }

    if (isRecording) {
      await stopRecording();
      return;
    }

    await startRecording();
  };

  if (!hasPermission) {
    const permissionBody = (
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
    );

    if (showPermissionFallbackAsScreen) {
      return <Screen className="bg-black">{permissionBody}</Screen>;
    }

    return <View className="flex-1 bg-black">{permissionBody}</View>;
  }

  // if (!device) {
  //   return (
  //     <View className="flex-1 items-center justify-center bg-background">
  //       <ActivityIndicator />
  //     </View>
  //   );
  // }

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
        {/* Top bar: close left, flash + torch right */}
        <View className="flex-row items-center justify-between px-[14px] pt-[14px]">
          <Pressable onPress={onRequestClose} hitSlop={12} className="rounded-full bg-black/50 p-2">
            <Ionicons name="close" size={22} color="white" />
          </Pressable>

          <View className="flex-row gap-2">
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
        </View>

        {/* Bottom controls */}
        <View className="absolute left-0 right-0 gap-[18px]" style={{ bottom: insets.bottom + 28 }}>
          {!isEventCaptureFlow && (
            <View className="flex-row self-center rounded-full border border-border bg-surface/50 p-[3px]">
              <Animated.View
                pointerEvents="none"
                className="absolute bottom-[3px] left-0 top-[3px] rounded-full bg-primary"
                style={pillStyle}
              />
              <Pressable
                className="rounded-full px-4 py-2"
                onLayout={(e) => {
                  photoTabX.value = e.nativeEvent.layout.x;
                  photoTabW.value = e.nativeEvent.layout.width;
                }}
                onPress={() => handleSetCaptureType('photo')}
              >
                <Text
                  className={
                    captureType === 'photo'
                      ? 'font-semibold text-primary-foreground'
                      : 'font-semibold text-muted-foreground'
                  }
                >
                  Photo
                </Text>
              </Pressable>
              <Pressable
                className="rounded-full px-4 py-2"
                onLayout={(e) => {
                  videoTabX.value = e.nativeEvent.layout.x;
                  videoTabW.value = e.nativeEvent.layout.width;
                }}
                onPress={() => handleSetCaptureType('video')}
              >
                <Text
                  className={
                    captureType === 'video'
                      ? 'font-semibold text-primary-foreground'
                      : 'font-semibold text-muted-foreground'
                  }
                >
                  Video
                </Text>
              </Pressable>
            </View>
          )}

          {/* Gallery left | Shutter center | Flip right */}
          <View className="flex-row items-center justify-between px-7">
            <LatestGalleryImage
              onPress={() => {
                router.push({
                  pathname: '/create/gallery' as never,
                  params: { mode } as never,
                });
              }}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isEventCaptureFlow || captureType === 'photo'
                  ? 'Capture photo'
                  : isRecording
                    ? 'Stop recording'
                    : 'Start recording'
              }
              onPress={handleCapture}
              disabled={isBusy && !isRecording}
              className="h-[84px] w-[84px] items-center justify-center rounded-full border-4 border-white bg-white/15"
            >
              <View
                className={`${captureType === 'video' ? 'bg-red-500' : 'bg-white'} ${isRecording ? 'h-[34px] w-[34px] rounded-lg' : captureType === 'video' ? 'h-[54px] w-[54px] rounded-[13px]' : 'h-[54px] w-[54px] rounded-full'}`}
              />
            </Pressable>

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
