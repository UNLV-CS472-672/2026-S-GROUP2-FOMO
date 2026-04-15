import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
    if (captureType === 'photo') {
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
      <SafeAreaView style={styles.permissionRoot}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          Enable camera permission to capture photos and videos.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <ActivityIndicator color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        photo
        video
        audio
        torch={torch}
      />

      <SafeAreaView style={StyleSheet.absoluteFill}>
        <View style={styles.topRow}>
          <Pressable style={styles.chipButton} onPress={() => router.back()}>
            <Text style={styles.chipButtonText}>Close</Text>
          </Pressable>

          <View style={styles.rightTopControls}>
            <Pressable
              style={styles.chipButton}
              onPress={() => setFlash((v) => (v === 'off' ? 'on' : 'off'))}
            >
              <Text style={styles.chipButtonText}>{flash === 'on' ? 'Flash On' : 'Flash Off'}</Text>
            </Pressable>
            <Pressable
              style={styles.chipButton}
              onPress={() => setTorch((v) => (v === 'off' ? 'on' : 'off'))}
            >
              <Text style={styles.chipButtonText}>{torch === 'on' ? 'Torch On' : 'Torch Off'}</Text>
            </Pressable>
            <Pressable
              style={styles.chipButton}
              onPress={() => setCameraFacing((v) => (v === 'back' ? 'front' : 'back'))}
            >
              <Text style={styles.chipButtonText}>Flip</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.bottomControls, { bottom: insets.bottom + 28 }]}>
          <View style={styles.modeToggle}>
            <Pressable
              style={[
                styles.modeToggleButton,
                captureType === 'photo' && styles.modeToggleButtonActive,
              ]}
              onPress={() => {
                if (!isRecording) setCaptureType('photo');
              }}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  captureType === 'photo' && styles.modeToggleTextActive,
                ]}
              >
                Photo
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeToggleButton,
                captureType === 'video' && styles.modeToggleButtonActive,
              ]}
              onPress={() => {
                if (!isRecording) setCaptureType('video');
              }}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  captureType === 'video' && styles.modeToggleTextActive,
                ]}
              >
                Video
              </Text>
            </Pressable>
          </View>

          <View style={styles.captureWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                captureType === 'photo'
                  ? 'Capture photo'
                  : isRecording
                    ? 'Stop recording'
                    : 'Start recording'
              }
              onPress={handleCapture}
              disabled={isBusy && !isRecording}
              style={styles.captureButtonOuter}
            >
              <View
                style={[
                  styles.captureButtonInner,
                  captureType === 'video' && styles.captureButtonInnerVideo,
                  isRecording && styles.captureButtonInnerRecording,
                ]}
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  permissionRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0b',
    paddingHorizontal: 24,
    gap: 12,
  },
  permissionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 28,
    textAlign: 'center',
  },
  permissionBody: {
    color: '#d4d4d4',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#1f1f1f',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 12,
  },
  rightTopControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  chipButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ffffff66',
    backgroundColor: '#00000066',
  },
  chipButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    gap: 18,
  },
  modeToggle: {
    alignSelf: 'center',
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff4d',
    backgroundColor: '#00000080',
    padding: 3,
  },
  modeToggleButton: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modeToggleButtonActive: {
    backgroundColor: '#fff',
  },
  modeToggleText: {
    color: '#fff',
    fontWeight: '600',
  },
  modeToggleTextActive: {
    color: '#000',
  },
  captureWrap: {
    alignItems: 'center',
  },
  captureButtonOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff22',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  captureButtonInnerVideo: {
    backgroundColor: '#ef4444',
    borderRadius: 13,
  },
  captureButtonInnerRecording: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
});
