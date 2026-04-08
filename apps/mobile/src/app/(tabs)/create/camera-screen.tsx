import { Button, ButtonText } from '@/components/ui/button';
import { useIsFocused } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type CaptureType = 'photo' | 'video';
type CreateReturnRoute = '/create/post' | '/create/event';

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
  const cameraRef = useRef<CameraView | null>(null);
  const params = useLocalSearchParams<CameraParams>();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [captureType, setCaptureType] = useState<CaptureType>('photo');
  const [isBusy, setIsBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const returnTo = getStringParam(params.returnTo);
  const isFromEvent = returnTo === '/create/event';

  const handleMediaCaptured = (mediaUri: string, mediaType: CaptureType) => {
    const pathname: CreateReturnRoute = isFromEvent ? '/create/event' : '/create/post';

    router.replace({
      pathname,
      params: {
        mediaUri,
        mediaType,
      },
    });
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isBusy) return;

    setIsBusy(true);
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (result?.uri) {
        handleMediaCaptured(result.uri, 'photo');
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleVideoRecording = async () => {
    if (!cameraRef.current || isBusy) return;

    if (isRecording) {
      cameraRef.current.stopRecording();
      return;
    }

    setIsBusy(true);
    setIsRecording(true);

    try {
      const result = await cameraRef.current.recordAsync();
      if (result?.uri) {
        handleMediaCaptured(result.uri, 'video');
      }
    } finally {
      setIsRecording(false);
      setIsBusy(false);
    }
  };

  const handleCapture = async () => {
    if (captureType === 'photo') {
      await handleTakePhoto();
      return;
    }

    await handleToggleVideoRecording();
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="mb-2 text-center text-2xl font-bold text-foreground">
          Camera access needed
        </Text>
        <Text className="mb-6 text-center text-base text-foreground">
          Enable camera permission to capture photos or videos.
        </Text>
        <Button onPress={requestPermission}>
          <ButtonText>Allow Camera Access</ButtonText>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        facing={cameraFacing}
        active={isFocused}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={StyleSheet.absoluteFill} className="p-4">
        <View className="flex-row items-center justify-between">
          <Button variant="secondary" onPress={() => router.back()}>
            <ButtonText variant="secondary">Close</ButtonText>
          </Button>
          <Button
            variant="secondary"
            onPress={() => setCameraFacing((current) => (current === 'back' ? 'front' : 'back'))}
          >
            <ButtonText variant="secondary">Flip</ButtonText>
          </Button>
        </View>

        <View
          className="absolute left-4 right-4 gap-4"
          style={{
            bottom: insets.bottom + 84,
          }}
        >
          <View className="mx-auto flex-row rounded-full border border-white/30 bg-black/40 p-1">
            <Pressable
              className={`rounded-full px-4 py-2 ${captureType === 'photo' ? 'bg-white' : ''}`}
              onPress={() => {
                if (!isRecording) setCaptureType('photo');
              }}
            >
              <Text className={captureType === 'photo' ? 'font-semibold text-black' : 'text-white'}>
                Photo
              </Text>
            </Pressable>
            <Pressable
              className={`rounded-full px-4 py-2 ${captureType === 'video' ? 'bg-white' : ''}`}
              onPress={() => {
                if (!isRecording) setCaptureType('video');
              }}
            >
              <Text className={captureType === 'video' ? 'font-semibold text-black' : 'text-white'}>
                Video
              </Text>
            </Pressable>
          </View>

          <View className="items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                captureType === 'photo'
                  ? 'Capture photo'
                  : isRecording
                    ? 'Stop recording'
                    : 'Start recording'
              }
              disabled={isBusy && !isRecording}
              onPress={handleCapture}
              className="h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-white/20"
            >
              <View
                className={`h-11 w-11 rounded-xl ${captureType === 'video' ? 'bg-red-500' : 'bg-white'} ${
                  isRecording ? 'h-8 w-8' : ''
                }`}
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
