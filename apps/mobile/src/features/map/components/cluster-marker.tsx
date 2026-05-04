import { Image } from '@/components/image';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import MapboxGL from '@rnmapbox/maps';
import { useQuery } from 'convex/react';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface ClusterMarkerProps {
  id: string;
  coordinate: [number, number];
  primaryLabel: string;
  primaryMediaId: Id<'_storage'> | null;
  secondaryLabel: string | null;
  secondaryMediaId: Id<'_storage'> | null;
  count: number;
  weight: number;
  minWeight: number;
  maxWeight: number;
  isActive?: boolean;
  onPress: () => void;
}

export function ClusterMarker({
  id,
  coordinate,
  primaryLabel,
  primaryMediaId,
  secondaryLabel,
  secondaryMediaId,
  count,
  weight,
  minWeight,
  maxWeight,
  isActive = true,
  onPress,
}: ClusterMarkerProps) {
  const primaryFile = useQuery(
    api.files.getFile,
    primaryMediaId ? { storageId: primaryMediaId } : 'skip'
  );
  const secondaryFile = useQuery(
    api.files.getFile,
    secondaryMediaId ? { storageId: secondaryMediaId } : 'skip'
  );

  const t = (weight - minWeight) / (maxWeight - minWeight || 1);
  const size = 44 + t * 44;
  const secondarySize = size * 0.72;
  const stemWidth = size * 0.28;
  const stemHeight = size * 0.22;
  const badgeSize = Math.max(18, size * 0.34);
  const remainder = count - 2;

  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = isActive
      ? withTiming(1, { duration: 300 })
      : withRepeat(withTiming(0.45, { duration: 1800 }), -1, true);
  }, [isActive, opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const borderClass = isActive ? 'border-primary' : 'border-muted-foreground';
  const stemColorClass = isActive ? 'border-t-primary' : 'border-t-muted-foreground';
  const fallbackBgClass = isActive ? 'bg-primary/10' : 'bg-muted';
  const badgeBgClass = isActive ? 'bg-primary' : 'bg-muted-foreground';

  // Anchor the MarkerView at the primary circle's bottom-center, not the full container center.
  const containerWidth = size + secondarySize * 0.55;
  const anchorX = size / 2 / containerWidth;
  // Stem must also shift left to sit under primary circle center.
  const stemOffset = -(secondarySize * 0.55) / 2;

  return (
    <MapboxGL.MarkerView id={id} coordinate={coordinate} allowOverlap anchor={{ x: anchorX, y: 1 }}>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={onPress} className="items-center">
          <View
            style={{
              width: containerWidth,
              height: size,
            }}
          >
            <View
              className={`absolute overflow-hidden rounded-full border-2 bg-background shadow-sm ${borderClass}`}
              style={{
                width: size,
                height: size,
                left: 0,
                top: 0,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 10,
              }}
            >
              {primaryFile?.url ? (
                <Image source={primaryFile.url} className="h-full w-full" contentFit="cover" />
              ) : (
                <View
                  className={`h-full w-full items-center justify-center px-2 ${fallbackBgClass}`}
                >
                  <Text className="text-lg font-bold uppercase text-foreground">
                    {primaryLabel.trim().charAt(0) || '?'}
                  </Text>
                </View>
              )}
            </View>

            <View
              className={`absolute overflow-hidden rounded-full border-2 bg-background ${borderClass}`}
              style={{
                width: secondarySize,
                height: secondarySize,
                right: 0,
                top: -(secondarySize * 0.18),
                elevation: 12,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
              }}
            >
              {secondaryFile?.url ? (
                <Image source={secondaryFile.url} className="h-full w-full" contentFit="cover" />
              ) : (
                <View
                  className={`h-full w-full items-center justify-center px-1 ${fallbackBgClass}`}
                >
                  <Text className="text-base font-bold uppercase text-foreground">
                    {(secondaryLabel ?? '').trim().charAt(0) || '?'}
                  </Text>
                </View>
              )}
            </View>

            {remainder > 0 ? (
              <View
                className={`absolute items-center justify-center rounded-full border-2 border-background ${badgeBgClass}`}
                style={{
                  width: badgeSize,
                  height: badgeSize,
                  minWidth: badgeSize,
                  right: -badgeSize * 0.2,
                  bottom: -badgeSize * 0.1,
                }}
              >
                <Text className="px-1 text-xs font-bold text-primary-foreground">+{remainder}</Text>
              </View>
            ) : null}
          </View>

          <View
            className={`-mt-px border-l-transparent border-r-transparent ${stemColorClass}`}
            style={{
              width: 0,
              height: 0,
              marginLeft: stemOffset,
              borderLeftWidth: stemWidth / 2,
              borderRightWidth: stemWidth / 2,
              borderTopWidth: stemHeight,
            }}
          />
        </Pressable>
      </Animated.View>
    </MapboxGL.MarkerView>
  );
}
