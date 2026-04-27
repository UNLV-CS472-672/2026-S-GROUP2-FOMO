import { Screen } from '@/components/ui/screen';
import { Authenticated, GuestOnly } from '@/features/auth/components/auth-gate';
import { CreateCameraDrawer } from '@/features/create/components/camera/drawer';
import { CreateForm } from '@/features/create/components/form';
import { CreateModeToggle } from '@/features/create/components/mode-toggle';
import { CreateSubmitButton } from '@/features/create/components/submit-button';
import { CREATE_DRAWER_SNAP_POINTS } from '@/features/create/constants';
import { useCreateContext } from '@/features/create/context';
import type { CreateMediaItem } from '@/features/create/types';
import { GuestMode } from '@/features/profile/components/guest-mode';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const {
    selectedMode,
    isEventMode,
    modeProgress,
    contentWidth,
    setMode,
    modeSwipeGesture,
    contentTrackStyle,
    postPanelStyle,
    eventPanelStyle,
    isFocused,
    drawerIndex,
    drawerAnimatedIndex,
    drawerAnimatedPosition,
    handleDrawerChange,
    handleCloseDrawer,
    onSubmit,
    isTagMenuOpen,
    isSubmitting,
  } = useCreateContext();

  const openManagePostMedia = (items: CreateMediaItem[]) => {
    router.push({
      pathname: '/create/manage-media' as never,
      params: {
        mode: 'post',
        postMedia: encodeURIComponent(JSON.stringify(items)),
      },
    });
  };

  return (
    <Screen>
      <GuestOnly>
        <GuestMode />
      </GuestOnly>

      <Authenticated>
        <GestureDetector gesture={modeSwipeGesture}>
          <View className="flex-1 bg-surface-muted">
            <CreateModeToggle
              selectedMode={selectedMode}
              modeProgress={modeProgress}
              topInset={insets.top}
              onSelectMode={setMode}
            />
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom: tabBarHeight + (isTagMenuOpen ? 220 : 176),
                paddingHorizontal: 16,
                rowGap: 18,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View
                className="flex-row items-start"
                style={[contentTrackStyle, { width: contentWidth * 2 }]}
              >
                <Animated.View style={[{ width: contentWidth }, postPanelStyle]}>
                  <CreateForm mode="post" openManagePostMedia={openManagePostMedia} />
                </Animated.View>

                <Animated.View style={[{ width: contentWidth }, eventPanelStyle]}>
                  <CreateForm mode="event" />
                </Animated.View>
              </Animated.View>
            </ScrollView>
          </View>
        </GestureDetector>

        <CreateCameraDrawer
          drawerIndex={drawerIndex}
          drawerSnapPoints={CREATE_DRAWER_SNAP_POINTS}
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
          disabled={isSubmitting}
        />
      </Authenticated>
    </Screen>
  );
}
