import { Screen } from '@/components/ui/screen';
import { Authenticated, GuestOnly } from '@/features/auth/components/auth-gate';
import { CreateCameraDrawer } from '@/features/create/components/camera-drawer';
import { CreateModePanel } from '@/features/create/components/mode-panel';
import { CreateModeToggle } from '@/features/create/components/mode-toggle';
import { CreateSubmitButton } from '@/features/create/components/submit-button';
import {
  CREATE_CAMERA_REVEAL_RESET_THRESHOLD,
  CREATE_CAMERA_REVEAL_THRESHOLD,
} from '@/features/create/constants';
import type { CreateFormValues, CreateMode, CreateParams } from '@/features/create/types';
import { getModeParam, getStringParam, toFileUri } from '@/features/create/utils';
import { GuestMode } from '@/features/profile/components/guest-mode';
import { setTabBarHidden } from '@/lib/tab-bar-visibility';
import { api } from '@fomo/backend/convex/_generated/api';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

export default function CreateScreen() {
  const params = useLocalSearchParams<CreateParams>();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const allTags = useQuery(api.tags.getAllTags) ?? [];
  const drawerAnimatedIndex = useSharedValue(0);
  const drawerAnimatedPosition = useSharedValue(0);
  const isCameraRevealed = useSharedValue(false);
  const drawerSnapPoints = useMemo(() => ['20.5%', '100%'], []);
  const { control, handleSubmit, setValue } = useForm<CreateFormValues>({
    defaultValues: {
      post: {
        description: '',
        tags: [],
        media: {
          uri: '',
          type: undefined,
        },
      },
      event: {
        description: '',
        tags: [],
        media: {
          uri: '',
          type: undefined,
        },
      },
    },
  });

  const [selectedMode, setSelectedMode] = useState<CreateMode>(getModeParam(params.mode));
  const [drawerIndex, setDrawerIndex] = useState(0);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const modeProgress = useSharedValue(getModeParam(params.mode) === 'event' ? 1 : 0);

  const mediaUriParam = getStringParam(params.mediaUri);
  const mediaTypeParam = getStringParam(params.mediaType);
  const incomingMode = getModeParam(params.mode);

  useEffect(() => {
    setSelectedMode(getModeParam(params.mode));
  }, [params.mode]);

  useEffect(() => {
    modeProgress.value = withTiming(selectedMode === 'event' ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [modeProgress, selectedMode]);

  useEffect(() => {
    if (!mediaUriParam) {
      return;
    }

    const nextMedia = {
      uri: toFileUri(mediaUriParam),
      type: mediaTypeParam,
    };

    setValue(incomingMode === 'event' ? 'event.media' : 'post.media', nextMedia, {
      shouldDirty: true,
    });

    setDrawerIndex(0);
  }, [incomingMode, mediaTypeParam, mediaUriParam, setValue]);

  useEffect(() => {
    setTabBarHidden(drawerIndex > 0);
  }, [drawerIndex]);

  useEffect(() => {
    if (!isFocused && drawerIndex === 0) {
      setTabBarHidden(false);
      return;
    }

    if (!isFocused && drawerIndex > 0) {
      setTabBarHidden(true);
    }
  }, [drawerIndex, isFocused]);

  const isEventMode = selectedMode === 'event';
  const mediaHeight = Math.max(180, Math.min(250, height * 0.28));
  const contentWidth = Math.max(width - 32, 0);

  const setMode = (mode: CreateMode) => {
    if (mode === selectedMode) {
      return;
    }

    setSelectedMode(mode);
  };

  const contentTrackStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: -contentWidth * modeProgress.value }],
    }),
    [contentWidth]
  );

  const switchModeFromSwipe = useCallback(
    (translationX: number, velocityX: number) => {
      const hasEnoughDistance = Math.abs(translationX) >= 48;
      const hasEnoughVelocity = Math.abs(velocityX) >= 700;

      if (!hasEnoughDistance && !hasEnoughVelocity) {
        return;
      }

      if (translationX < 0 && selectedMode !== 'event') {
        setMode('event');
      }

      if (translationX > 0 && selectedMode !== 'post') {
        setMode('post');
      }
    },
    [selectedMode]
  );

  const openCamera = useCallback(() => {
    setDrawerIndex(1);
  }, []);

  const handleDrawerChange = useCallback((nextIndex: number) => {
    setDrawerIndex(Math.max(nextIndex, 0));
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerIndex(0);
  }, []);

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

  const onSubmit = handleSubmit((values) => {
    const activeValues = values[selectedMode];
    const normalizedDescription = activeValues.description.trim();
    const normalizedTags = activeValues.tags.join(', ');
    const noun = isEventMode ? 'Event' : 'Post';

    Alert.alert(
      `${noun} Data`,
      `Description: ${normalizedDescription || '(none)'}\nTags: ${normalizedTags || '(none)'}`,
      [{ text: 'OK' }]
    );
  });

  const modeSwipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onEnd((event) => {
      scheduleOnRN(switchModeFromSwipe, event.translationX, event.velocityX);
    });

  return (
    <Screen>
      <GuestOnly>
        <GuestMode />
      </GuestOnly>

      <Authenticated>
        <GestureDetector gesture={modeSwipeGesture}>
          <View className="flex-1 bg-background">
            <CreateModeToggle
              selectedMode={selectedMode}
              modeProgress={modeProgress}
              topInset={insets.top}
              onSelectMode={setMode}
            />
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom: tabBarHeight + (isTagMenuOpen ? 320 : 176),
                paddingHorizontal: 16,
                rowGap: 18,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ overflow: 'hidden' }}>
                <Animated.View
                  className="flex-row items-start"
                  style={[
                    contentTrackStyle,
                    {
                      width: contentWidth * 2,
                    },
                  ]}
                >
                  <View style={{ width: contentWidth }}>
                    <CreateModePanel
                      control={control}
                      setValue={setValue}
                      mode="post"
                      mediaHeight={mediaHeight}
                      isTagMenuOpen={!isEventMode && isTagMenuOpen}
                      setIsTagMenuOpen={setIsTagMenuOpen}
                      allTags={allTags}
                      openCamera={openCamera}
                    />
                  </View>

                  <View style={{ width: contentWidth }}>
                    <CreateModePanel
                      control={control}
                      setValue={setValue}
                      mode="event"
                      mediaHeight={mediaHeight}
                      isTagMenuOpen={isEventMode && isTagMenuOpen}
                      setIsTagMenuOpen={setIsTagMenuOpen}
                      allTags={allTags}
                      openCamera={openCamera}
                    />
                  </View>
                </Animated.View>
              </View>
            </ScrollView>
          </View>
        </GestureDetector>

        <CreateCameraDrawer
          drawerIndex={drawerIndex}
          drawerSnapPoints={drawerSnapPoints}
          mode={selectedMode}
          isParentFocused={isFocused}
          animatedIndex={drawerAnimatedIndex}
          animatedPosition={drawerAnimatedPosition}
          onChange={handleDrawerChange}
          onClose={handleCloseDrawer}
        />

        <CreateSubmitButton
          isEventMode={isEventMode}
          animatedIndex={drawerAnimatedIndex}
          animatedPosition={drawerAnimatedPosition}
          onPress={onSubmit}
        />
      </Authenticated>
    </Screen>
  );
}
