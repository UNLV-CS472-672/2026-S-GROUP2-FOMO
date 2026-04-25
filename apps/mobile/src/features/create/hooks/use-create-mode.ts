import type { CreateMode, CreateParams } from '@/features/create/types';
import { getModeParam } from '@/features/create/utils';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export function useCreateMode() {
  const params = useLocalSearchParams<CreateParams>();
  const { height, width } = useWindowDimensions();

  const [selectedMode, setSelectedMode] = useState<CreateMode>(getModeParam(params.mode));
  const modeProgress = useSharedValue(getModeParam(params.mode) === 'event' ? 1 : 0);

  const isEventMode = selectedMode === 'event';
  const mediaHeight = Math.max(180, Math.min(250, height * 0.28));
  const contentWidth = Math.max(width - 32, 0);

  useEffect(() => {
    setSelectedMode(getModeParam(params.mode));
  }, [params.mode]);

  useEffect(() => {
    modeProgress.value = withTiming(selectedMode === 'event' ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [modeProgress, selectedMode]);

  const setMode = useCallback(
    (mode: CreateMode) => {
      if (mode === selectedMode) return;
      setSelectedMode(mode);
    },
    [selectedMode]
  );

  const switchModeFromSwipe = useCallback(
    (translationX: number, velocityX: number) => {
      const hasEnoughDistance = Math.abs(translationX) >= 48;
      const hasEnoughVelocity = Math.abs(velocityX) >= 700;
      if (!hasEnoughDistance && !hasEnoughVelocity) return;
      if (translationX < 0 && selectedMode !== 'event') setMode('event');
      if (translationX > 0 && selectedMode !== 'post') setMode('post');
    },
    [selectedMode, setMode]
  );

  const modeSwipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onEnd((event) => {
      scheduleOnRN(switchModeFromSwipe, event.translationX, event.velocityX);
    });

  const contentTrackStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: -contentWidth * modeProgress.value }] }),
    [contentWidth]
  );

  const postPanelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeProgress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
  }));

  const eventPanelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeProgress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return {
    selectedMode,
    isEventMode,
    modeProgress,
    mediaHeight,
    contentWidth,
    setMode,
    modeSwipeGesture,
    contentTrackStyle,
    postPanelStyle,
    eventPanelStyle,
  };
}
