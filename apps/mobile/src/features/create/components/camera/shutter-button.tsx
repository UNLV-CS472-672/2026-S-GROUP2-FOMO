import { Pressable, View } from 'react-native';

type CaptureType = 'photo' | 'video';

type ShutterButtonProps = {
  captureType: CaptureType;
  isRecording: boolean;
  isBusy: boolean;
  onPress: () => void;
};

export function ShutterButton({ captureType, isRecording, isBusy, onPress }: ShutterButtonProps) {
  const isVideo = captureType === 'video';
  const innerClass = isRecording
    ? 'h-[34px] w-[34px] rounded-lg bg-red-500'
    : isVideo
      ? 'h-[54px] w-[54px] rounded-[13px] bg-red-500'
      : 'h-[54px] w-[54px] rounded-full bg-white';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        !isVideo ? 'Capture photo' : isRecording ? 'Stop recording' : 'Start recording'
      }
      onPress={onPress}
      disabled={isBusy && !isRecording}
      className="h-[84px] w-[84px] items-center justify-center rounded-full border-4 border-white bg-white/15"
    >
      <View className={innerClass} />
    </Pressable>
  );
}
