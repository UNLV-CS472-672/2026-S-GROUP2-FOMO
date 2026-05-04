import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

function SkeletonBox({ className }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }} className={`bg-muted ${className}`} />;
}

function DeviceRowSkeleton({ last = false }: { last?: boolean }) {
  return (
    <View className={`flex-row gap-4 px-5 py-4 ${last ? '' : 'border-b border-border'}`}>
      {/* icon placeholder */}
      <View className="items-center pt-0.5">
        <SkeletonBox className="h-11 w-11 rounded-2xl" />
      </View>

      {/* text lines */}
      <View className="flex-1 gap-2 justify-center">
        {/* device name + badge */}
        <View className="flex-row items-center gap-2">
          <SkeletonBox className="h-5 w-2/5 rounded-lg" />
          <SkeletonBox className="h-5 w-1/5 rounded-xl" />
        </View>
        <SkeletonBox className="h-4 w-3/5 rounded-lg" />
        <SkeletonBox className="h-4 w-2/5 rounded-lg" />
      </View>

      {/* action button placeholder */}
      <SkeletonBox className="mt-1 h-10 w-10 rounded-2xl" />
    </View>
  );
}

export function DevicesLoadingSkeleton() {
  const ROWS = 3;
  return (
    <>
      {/* header */}
      <View className="gap-3">
        <SkeletonBox className="h-6 w-2/5 rounded-lg" />
        <SkeletonBox className="h-4 w-full rounded-lg" />
        <SkeletonBox className="h-4 w-4/5 rounded-lg" />
      </View>

      {/* card */}
      <View className="overflow-hidden rounded-3xl border border-border bg-card">
        {Array.from({ length: ROWS }).map((_, i) => (
          <DeviceRowSkeleton key={i} last={i === ROWS - 1} />
        ))}
      </View>
    </>
  );
}
