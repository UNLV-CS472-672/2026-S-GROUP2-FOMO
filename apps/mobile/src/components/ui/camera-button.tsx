import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, TouchableOpacity } from 'react-native';

import { Button } from '@/components/ui/button';

type CameraButtonProps = {
  onCapture: () => void;
  onFlip?: () => void;
  onOpenGallery?: () => void;
  galleryPreviewUri?: string | null;
  disabled?: boolean;
  isCapturing?: boolean;
};

export default function CameraButton({
  onCapture,
  onFlip,
  onOpenGallery,
  galleryPreviewUri,
  disabled = false,
  isCapturing = false,
}: CameraButtonProps) {
  const shutterScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isCapturing) {
      return;
    }

    Animated.sequence([
      Animated.timing(shutterScale, {
        toValue: 0.9,
        duration: 70,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shutterScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isCapturing, shutterScale]);

  return (
    <Animated.View
      className="relative w-full items-center justify-center"
      style={{ transform: [{ scale: shutterScale }] }}
    >
      {onOpenGallery ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open gallery"
          className="absolute left-0 h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-orange-400 bg-black/45"
          onPress={onOpenGallery}
          activeOpacity={0.85}
        >
          {galleryPreviewUri ? (
            <Image
              source={{ uri: galleryPreviewUri }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <MaterialIcons name="photo-library" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Capture photo"
        className="h-[72px] w-[92px] items-center justify-center rounded-[20px] border-[3px] border-white bg-white/15"
        onPress={onCapture}
        activeOpacity={0.9}
        disabled={disabled || isCapturing}
      >
        <Animated.View
          className={`h-[52px] w-[72px] rounded-[14px] border-2 border-black/40 ${
            disabled || isCapturing ? 'bg-zinc-300' : 'bg-zinc-100'
          }`}
        />
      </TouchableOpacity>

      {onFlip ? (
        <Button
          variant="icon"
          size="lg"
          className="absolute right-0 h-12 w-12 rounded-full border border-white/60 bg-black/45"
          onPress={onFlip}
          accessibilityLabel="Flip camera"
        >
          <MaterialIcons name="cached" size={24} color="#ffffff" />
        </Button>
      ) : null}
    </Animated.View>
  );
}
