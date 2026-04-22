import { Image } from '@/components/image';
import type { FeedPost } from '@/features/posts/types';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StatusBar, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

const SPRING = { damping: 15, stiffness: 200 } as const;
const DISMISS_THRESHOLD = 150;
const DISMISS_VELOCITY = 1000;

function Dot({
  index,
  scrollX,
  slideWidth,
}: {
  index: number;
  scrollX: SharedValue<number>;
  slideWidth: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollX.value,
      [(index - 1) * slideWidth, index * slideWidth, (index + 1) * slideWidth],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      width: interpolate(progress, [0, 1], [6, 18]),
      opacity: interpolate(progress, [0, 1], [0.4, 1]),
    };
  });
  return <Animated.View className="rounded-full bg-white" style={[{ height: 6 }, animatedStyle]} />;
}
const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 2.5;

function CarouselSlide({
  mediaId,
  width,
  height,
  isActive,
  isZoomed,
  onZoomed,
  onClose,
  dismissY,
  dismissOpacity,
}: {
  mediaId: Id<'_storage'>;
  width: number;
  height: number;
  isActive: boolean;
  isZoomed: boolean;
  onZoomed: (zoomed: boolean) => void;
  onClose: () => void;
  dismissY: SharedValue<number>;
  dismissOpacity: SharedValue<number>;
}) {
  const mediaUrl = useQuery(api.files.getUrl, { storageId: mediaId });
  const mediaMetadata = useQuery(api.files.getMetadata, { storageId: mediaId });
  const mediaTypeResolved = mediaMetadata !== undefined;
  const isVideo = mediaMetadata?.contentType?.startsWith('video/') ?? false;

  const player = useVideoPlayer(isVideo ? (mediaUrl ?? null) : null);

  useEffect(() => {
    if (!mediaUrl || !isVideo) return;
    player.loop = true;
    player.muted = false;
    if (isActive) {
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
    }
  }, [isActive, isVideo, mediaUrl, player]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    if (!isActive) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, MAX_SCALE));
    })
    .onEnd(() => {
      if (scale.value < 1.1) {
        scale.value = withSpring(1, SPRING);
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        scheduleOnRN(onZoomed, false);
      } else {
        savedScale.value = scale.value;
        scheduleOnRN(onZoomed, true);
      }
    });

  const pan = Gesture.Pan()
    .enabled(isZoomed)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const dismissPan = Gesture.Pan()
    .enabled(!isZoomed)
    .activeOffsetY(10)
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      dismissY.value = Math.max(0, e.translationY);
      dismissOpacity.value = interpolate(
        Math.max(0, e.translationY),
        [0, height / 3],
        [1, 0.3],
        Extrapolation.CLAMP
      );
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > DISMISS_VELOCITY) {
        dismissOpacity.value = withTiming(0, { duration: 200 });
        dismissY.value = withTiming(
          height,
          { duration: 280, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) scheduleOnRN(onClose);
          }
        );
      } else {
        dismissY.value = withSpring(0, SPRING);
        dismissOpacity.value = withSpring(1, SPRING);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((e) => {
      if (scale.value > 1) {
        scale.value = withSpring(1, SPRING);
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        scheduleOnRN(onZoomed, false);
      } else {
        const focalX = e.x - width / 2;
        const focalY = e.y - height / 2;
        const tx = -focalX * (DOUBLE_TAP_SCALE - 1);
        const ty = -focalY * (DOUBLE_TAP_SCALE - 1);
        scale.value = withSpring(DOUBLE_TAP_SCALE, SPRING);
        translateX.value = withSpring(tx, SPRING);
        translateY.value = withSpring(ty, SPRING);
        savedScale.value = DOUBLE_TAP_SCALE;
        savedTranslateX.value = tx;
        savedTranslateY.value = ty;
        scheduleOnRN(onZoomed, true);
      }
    });

  const singleTap = Gesture.Tap().onEnd(() => {
    if (scale.value <= 1) scheduleOnRN(onClose);
  });

  const imageGesture = Gesture.Simultaneous(
    pinch,
    dismissPan,
    Gesture.Race(Gesture.Exclusive(doubleTap, singleTap), pan)
  );
  const composed = isVideo ? dismissPan : imageGesture;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const dismissStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dismissY.value }],
    opacity: dismissOpacity.value,
  }));

  return (
    <Animated.View style={[{ width, height }, dismissStyle]}>
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}
        >
          {isVideo ? (
            <VideoView
              player={player}
              style={{ width, height }}
              contentFit="contain"
              nativeControls
            />
          ) : mediaTypeResolved && mediaUrl ? (
            <Image source={mediaUrl} style={{ width, height }} contentFit="contain" />
          ) : (
            <View style={{ width, height, backgroundColor: 'black' }} />
          )}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export function MediaCarousel({
  mediaIds,
  initialIndex,
  onClose,
}: {
  mediaIds: FeedPost['mediaIds'];
  initialIndex: number;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const scrollX = useSharedValue(initialIndex * width);
  const dismissY = useSharedValue(0);
  const dismissOpacity = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <BlurView intensity={90} tint="dark" style={{ flex: 1 }}>
        <Animated.FlatList
          data={mediaIds}
          horizontal
          pagingEnabled
          scrollEnabled={!isZoomed}
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(newIndex);
            setIsZoomed(false);
          }}
          renderItem={({ item, index }) => (
            <CarouselSlide
              mediaId={item}
              width={width}
              height={height}
              isActive={index === currentIndex}
              isZoomed={isZoomed}
              onZoomed={setIsZoomed}
              onClose={onClose}
              dismissY={dismissY}
              dismissOpacity={dismissOpacity}
            />
          )}
          keyExtractor={(item, i) => `${item}-${i}`}
        />

        <View style={{ position: 'absolute', left: 0, right: 0, top: insets.top }}>
          <View className="flex-row items-center justify-between px-4 py-2">
            <Pressable onPress={onClose} hitSlop={12} className="rounded-full bg-black/50 p-2">
              <Ionicons name="close" size={22} color="white" />
            </Pressable>
            {mediaIds.length > 1 && (
              <View className="rounded-full bg-black/50 px-3 py-1">
                <Text className="text-sm font-semibold text-white">
                  {currentIndex + 1} / {mediaIds.length}
                </Text>
              </View>
            )}
          </View>
        </View>

        {mediaIds.length > 1 && (
          <View style={{ position: 'absolute', bottom: insets.bottom, left: 0, right: 0 }}>
            <View className="flex-row items-center justify-center gap-1.5 pb-4 pt-2">
              {mediaIds.map((_, i) => (
                <Dot key={i} index={i} scrollX={scrollX} slideWidth={width} />
              ))}
            </View>
          </View>
        )}
      </BlurView>
    </Modal>
  );
}
