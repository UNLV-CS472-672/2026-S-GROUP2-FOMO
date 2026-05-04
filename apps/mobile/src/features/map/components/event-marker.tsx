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

interface EventMarkerProps {
  id: string;
  coordinate: [number, number];
  label: string;
  mediaId: Id<'_storage'> | null;
  // Raw attendee weight — same value passed to the heatmap layer (0–6 scale).
  weight: number;
  minWeight: number;
  maxWeight: number;
  isActive?: boolean;
  onPress: () => void;
}

/*
 * function provides event markers similar to life360
 * size scales with heatmap layer (one to one match)
 */
export function EventMarker({
  id,
  coordinate,
  label,
  mediaId,
  weight,
  minWeight,
  maxWeight,
  isActive = true,
  onPress,
}: EventMarkerProps) {
  const file = useQuery(api.files.getFile, mediaId ? { storageId: mediaId } : 'skip');

  // normalize against actual min/max so the full range is always used
  const t = (weight - minWeight) / (maxWeight - minWeight || 1);
  const size = 44 + t * 44;
  const stemWidth = size * 0.28;
  const stemHeight = size * 0.22;

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

  return (
    <MapboxGL.MarkerView id={id} coordinate={coordinate} allowOverlap anchor={{ x: 0.5, y: 1 }}>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={onPress} className="items-center">
          <View
            className={`overflow-hidden rounded-full border-2 bg-background shadow-sm ${borderClass}`}
            style={{
              width: size,
              height: size,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 10,
            }}
          >
            {file?.url ? (
              <Image source={file.url} className="h-full w-full" contentFit="cover" />
            ) : (
              <View className={`h-full w-full items-center justify-center px-2 ${fallbackBgClass}`}>
                <Text className="text-lg font-bold uppercase text-foreground">
                  {label.trim().charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>

          <View
            className={`-mt-px border-l-transparent border-r-transparent ${stemColorClass}`}
            style={{
              width: 0,
              height: 0,
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
