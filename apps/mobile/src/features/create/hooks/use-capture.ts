import type { CreateMode } from '@/features/create/types';
import * as MediaLibrary from 'expo-media-library';
import { type RefObject, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { CameraDevice } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';

type CaptureType = 'photo' | 'video';
type MicrophoneStatus = 'granted' | 'denied' | 'not-determined' | 'restricted';

type UseCaptureOptions = {
  mode: CreateMode;
  cameraRef: RefObject<Camera | null>;
  device: CameraDevice | undefined;
  flash: 'on' | 'off';
  onPreview: (uri: string, type: CaptureType) => void;
};

export function useCapture({ mode, cameraRef, device, flash, onPreview }: UseCaptureOptions) {
  const isEventFlow = mode === 'event';

  const [captureType, setCaptureType] = useState<CaptureType>('photo');
  const [isBusy, setIsBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [microphonePermission, setMicrophonePermission] =
    useState<MicrophoneStatus>('not-determined');

  useEffect(() => {
    if (isEventFlow) setCaptureType('photo');
  }, [isEventFlow]);

  useEffect(() => {
    setMicrophonePermission(Camera.getMicrophonePermissionStatus());
  }, []);

  const autoSave = async (path: string) => {
    const uri = path.startsWith('file://') ? path : `file://${path}`;
    try {
      const current = await MediaLibrary.getPermissionsAsync();
      const permission = current.granted ? current : await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) return;
      await MediaLibrary.saveToLibraryAsync(uri);
    } catch {
      // Ignore save errors to avoid interrupting capture flow.
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || isBusy || !device) return;
    setIsBusy(true);
    try {
      const photo = await cameraRef.current.takePhoto({ flash, enableShutterSound: false });
      if (photo?.path) {
        void autoSave(photo.path);
        onPreview(photo.path, 'photo');
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
          void autoSave(video.path);
          onPreview(video.path, 'video');
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
    if (isEventFlow || captureType === 'photo') {
      await takePhoto();
      return;
    }
    if (isRecording) {
      await stopRecording();
      return;
    }
    await startRecording();
  };

  return { captureType, setCaptureType, isBusy, isRecording, handleCapture, isEventFlow };
}
