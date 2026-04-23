import { Screen } from '@/components/ui/screen';
import { LatestGalleryImage } from '@/features/create/components/latest-gallery-image';
import { useIsFocused } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

type CaptureType = 'photo' | 'video';
type CameraFacing = 'front' | 'back';

type CameraParams = {
  returnTo?: string | string[];
};

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function CameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<CameraParams>();
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('back');
  const [captureType, setCaptureType] = useState<CaptureType>('photo');
  const [isBusy, setIsBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [torch, setTorch] = useState<'on' | 'off'>('off');
  const [microphonePermission, setMicrophonePermission] = useState<
    'granted' | 'denied' | 'not-determined' | 'restricted'
  >('not-determined');

  const device = useCameraDevice(cameraFacing);
  const returnTo =
    getStringParam(params.returnTo) === '/create/event' ? '/create/event' : '/create/post';
  const isEventCaptureFlow = returnTo === '/create/event';

  useEffect(() => {
    if (isEventCaptureFlow) {
      setCaptureType('photo');
    }
  }, [isEventCaptureFlow]);

  useEffect(() => {
    setMicrophonePermission(Camera.getMicrophonePermissionStatus());
  }, []);

  const openPreview = (mediaUri: string, mediaType: CaptureType) => {
    router.replace({
      pathname: '/create/post-preview' as never,
      params: {
        mediaUri,
        mediaType,
        returnTo,
      } as never,
    });
  };

  const autoSaveCapturedMedia = async (mediaPath: string) => {
    const mediaUri = mediaPath.startsWith('file://') ? mediaPath : `file://${mediaPath}`;

    try {
      const currentPermission = await MediaLibrary.getPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        return;
      }

      await MediaLibrary.saveToLibraryAsync(mediaUri);
    } catch {
      // Ignore save errors to avoid interrupting capture flow.
    }
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
        void autoSaveCapturedMedia(photo.path);
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
          void autoSaveCapturedMedia(video.path);
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
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-center text-[28px] font-bold">Camera access needed</Text>
          <Text className="text-center text-base leading-5.5">
            Enable camera permission to capture photos and videos.
          </Text>
          <Pressable className="mt-2 rounded-full border px-4.5 py-2.5" onPress={requestPermission}>
            <Text className="font-semibold">Allow Camera Access</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!device) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Camera
        ref={cameraRef}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        device={device}
        isActive={isFocused}
        photo
        video
        audio
        torch={torch}
      />

      <SafeAreaView style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        <View className="flex-row items-start justify-between gap-3 px-[14px] pt-[14px]">
          <Pressable
            className="rounded-full border border-white/40 bg-black/40 px-3 py-2"
            onPress={() => router.back()}
          >
            <Text className="text-[13px] font-semibold text-white">Close</Text>
          </Pressable>

          <View className="flex-row flex-wrap justify-end gap-2">
            <Pressable
              className="rounded-full border border-white/40 bg-black/40 px-3 py-2"
              onPress={() => setFlash((v) => (v === 'off' ? 'on' : 'off'))}
            >
              <Text className="text-[13px] font-semibold text-white">
                {flash === 'on' ? 'Flash On' : 'Flash Off'}
              </Text>
            </Pressable>
            <Pressable
              className="rounded-full border border-white/40 bg-black/40 px-3 py-2"
              onPress={() => setTorch((v) => (v === 'off' ? 'on' : 'off'))}
            >
              <Text className="text-[13px] font-semibold text-white">
                {torch === 'on' ? 'Torch On' : 'Torch Off'}
              </Text>
            </Pressable>
            <Pressable
              className="rounded-full border border-white/40 bg-black/40 px-3 py-2"
              onPress={() => setCameraFacing((v) => (v === 'back' ? 'front' : 'back'))}
            >
              <Text className="text-[13px] font-semibold text-white">Flip</Text>
            </Pressable>
          </View>
        </View>

        <View className="absolute left-0 right-0 gap-[18px]" style={{ bottom: insets.bottom + 28 }}>
          {!isEventCaptureFlow && (
            <View
              className="self-center rounded-full border border-white/30 bg-black/50 p-[3px]"
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Pressable
                className={`rounded-full px-4 py-2 ${captureType === 'photo' ? 'bg-white' : ''}`}
                style={{ marginRight: 4 }}
                onPress={() => {
                  if (!isRecording) setCaptureType('photo');
                }}
              >
                <Text
                  className={
                    captureType === 'photo'
                      ? 'font-semibold text-black'
                      : 'font-semibold text-white'
                  }
                >
                  Photo
                </Text>
              </Pressable>
              <Pressable
                className={`rounded-full px-4 py-2 ${captureType === 'video' ? 'bg-white' : ''}`}
                onPress={() => {
                  if (!isRecording) setCaptureType('video');
                }}
              >
                <Text
                  className={
                    captureType === 'video'
                      ? 'font-semibold text-black'
                      : 'font-semibold text-white'
                  }
                >
                  Video
                </Text>
              </Pressable>
            </View>
          )}

          <View className="items-center">
            <View className="absolute right-7 top-[16px]">
              <LatestGalleryImage
                onPress={() => {
                  router.push({
                    pathname: '/create/gallery' as never,
                    params: {
                      returnTo,
                    } as never,
                  });
                }}
              />
            </View>

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
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
