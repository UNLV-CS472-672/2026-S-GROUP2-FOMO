import {
  CREATE_CAMERA_REVEAL_RESET_THRESHOLD,
  CREATE_CAMERA_REVEAL_THRESHOLD,
} from '@/features/create/constants';
import { setTabBarHidden } from '@/lib/tab-bar-visibility';
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export function useCreateDrawer() {
  const isFocused = useIsFocused();

  const drawerAnimatedIndex = useSharedValue(0);
  const drawerAnimatedPosition = useSharedValue(0);
  const isCameraRevealed = useSharedValue(false);

  const [drawerIndex, setDrawerIndex] = useState(0);

  useEffect(() => {
    setTabBarHidden(drawerIndex > 0);
  }, [drawerIndex]);

  useAnimatedReaction(
    () => drawerAnimatedIndex.value,
    (currentIndex) => {
      if (!isCameraRevealed.value && currentIndex >= CREATE_CAMERA_REVEAL_THRESHOLD) {
        isCameraRevealed.value = true;
        scheduleOnRN(setTabBarHidden, true);
      } else if (isCameraRevealed.value && currentIndex <= CREATE_CAMERA_REVEAL_RESET_THRESHOLD) {
        isCameraRevealed.value = false;
        scheduleOnRN(setTabBarHidden, false);
      }
    },
    []
  );

  const openCamera = useCallback(() => setDrawerIndex(1), []);
  const handleDrawerChange = useCallback(
    (nextIndex: number) => setDrawerIndex(Math.max(nextIndex, 0)),
    []
  );
  const handleCloseDrawer = useCallback(() => setDrawerIndex(0), []);

  return {
    isFocused,
    drawerIndex,
    drawerAnimatedIndex,
    drawerAnimatedPosition,
    openCamera,
    handleDrawerChange,
    handleCloseDrawer,
  };
}
