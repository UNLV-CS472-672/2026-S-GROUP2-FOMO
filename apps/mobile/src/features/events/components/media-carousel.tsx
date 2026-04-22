import { Image } from '@/components/image';
import type { FeedPost } from '@/features/events/types';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

const SPRING = { damping: 15, stiffness: 200 } as const;

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
}: {
  mediaId: Id<'_storage'>;
  width: number;
  height: number;
  isActive: boolean;
  isZoomed: boolean;
  onZoomed: (zoomed: boolean) => void;
  onClose: () => void;
}) {
  const mediaUrl = useQuery(api.files.getUrl, { storageId: mediaId });

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset when the slide scrolls out of view
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

  // Pan is only enabled when zoomed — keeps carousel swipe working at 1x
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
        // Zoom into the tapped focal point
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

  const composed = Gesture.Simultaneous(
    pinch,
    Gesture.Race(Gesture.Exclusive(doubleTap, singleTap), pan)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}
      >
        {mediaUrl ? (
          <Image source={mediaUrl} style={{ width, height }} contentFit="contain" />
        ) : null}
      </Animated.View>
    </GestureDetector>
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
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const scrollX = useSharedValue(initialIndex * width);

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
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
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
            />
          )}
          keyExtractor={(item, i) => `${item}-${i}`}
        />

        <SafeAreaView style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
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
        </SafeAreaView>

        {mediaIds.length > 1 && (
          <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <View className="flex-row items-center justify-center gap-1.5 pb-4 pt-2">
              {mediaIds.map((_, i) => (
                <Dot key={i} index={i} scrollX={scrollX} slideWidth={width} />
              ))}
            </View>
          </SafeAreaView>
        )}
      </BlurView>
    </Modal>
  );
}
