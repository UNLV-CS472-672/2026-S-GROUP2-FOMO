import { Drawer } from '@/components/ui/drawer';
import { CreateCameraCaptureView } from '@/features/create/components/camera/view';
import {
  CREATE_CAMERA_CROSSFADE_END,
  CREATE_CAMERA_CROSSFADE_START,
  CREATE_CAMERA_WARMUP_THRESHOLD,
} from '@/features/create/constants';
import type { CreateMode } from '@/features/create/types';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type CreateCameraDrawerProps = {
  drawerIndex: number;
  drawerSnapPoints: string[];
  mode: CreateMode;
  isParentFocused: boolean;
  animatedIndex: SharedValue<number>;
  animatedPosition: SharedValue<number>;
  onChange: (nextIndex: number) => void;
  onClose: () => void;
};

export function CreateCameraDrawer({
  drawerIndex,
  drawerSnapPoints,
  mode,
  isParentFocused,
  animatedIndex,
  animatedPosition,
  onChange,
  onClose,
}: CreateCameraDrawerProps) {
  const isCameraWarmedUp = useSharedValue(false);
  const tabBarHeight = useBottomTabBarHeight();
  // Worklet-side tracker so we can guard scheduleOnRN without reading React state.
  const isCameraInteractiveWV = useSharedValue(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraInteractive, setIsCameraInteractive] = useState(false);

  useAnimatedReaction(
    () => animatedIndex.value,
    (currentIndex) => {
      // Pre-warm: start the camera pipeline early so the feed is ready
      // well before it becomes visible at CREATE_CAMERA_CROSSFADE_START.
      if (!isCameraWarmedUp.value && currentIndex > CREATE_CAMERA_WARMUP_THRESHOLD) {
        isCameraWarmedUp.value = true;
        scheduleOnRN(setIsCameraActive, true);
      } else if (isCameraWarmedUp.value && currentIndex <= 0) {
        isCameraWarmedUp.value = false;
        scheduleOnRN(setIsCameraActive, false);
      }

      // Enable touches only once the camera is fully visible; remove them
      // as soon as it starts fading out. CROSSFADE_START/END give hysteresis.
      if (!isCameraInteractiveWV.value && currentIndex >= CREATE_CAMERA_CROSSFADE_END) {
        isCameraInteractiveWV.value = true;
        scheduleOnRN(setIsCameraInteractive, true);
      } else if (isCameraInteractiveWV.value && currentIndex <= CREATE_CAMERA_CROSSFADE_START) {
        isCameraInteractiveWV.value = false;
        scheduleOnRN(setIsCameraInteractive, false);
      }
    },
    []
  );

  // Safety net for programmatic closes that skip the animated threshold.
  useEffect(() => {
    if (drawerIndex === 0) {
      setIsCameraInteractive(false);
      setIsCameraActive(false);
    }
  }, [drawerIndex]);

  // Opacity is interpolated directly from animatedIndex — no withTiming — so
  // the cross-fade tracks the finger rather than running on an independent timer.
  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [CREATE_CAMERA_CROSSFADE_START, CREATE_CAMERA_CROSSFADE_END],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const cameraStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [CREATE_CAMERA_CROSSFADE_START, CREATE_CAMERA_CROSSFADE_END],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Drawer
      index={drawerIndex}
      bottomInset={tabBarHeight}
      snapPoints={drawerSnapPoints}
      backdropAppearsOnIndex={1}
      backdropDisappearsOnIndex={0}
      showHandle={false}
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      onChange={onChange}
    >
      <View
        className="flex-1 overflow-hidden"
        style={{
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
        }}
      >
        <Animated.View
          className="absolute inset-0"
          pointerEvents={isCameraInteractive ? 'auto' : 'none'}
          style={cameraStyle}
        >
          <CreateCameraCaptureView
            mode={mode}
            isActive={isParentFocused && isCameraActive}
            onRequestClose={onClose}
            retakeDestination="create-drawer"
          />
        </Animated.View>

        <Animated.View
          className="absolute inset-0 rounded-t-[32px] bg-surface px-4"
          pointerEvents="none"
          style={hintStyle}
        >
          <View className="items-center">
            {/* HACK: manual handle so it's not included once fully expanded   */}
            <View className="mt-[9.5px] h-1 w-10 rounded-full light:bg-[#786860] dark:bg-[#baa99f]" />

            <Text className="mt-8 text-[12px] font-semibold uppercase tracking-[0.8px] text-muted-foreground">
              Swipe up to open camera
            </Text>
          </View>
        </Animated.View>
      </View>
    </Drawer>
  );
}
