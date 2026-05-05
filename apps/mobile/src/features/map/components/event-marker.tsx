import { Image } from '@/components/image';
import { markerFadeZooms } from '@/features/map/utils/marker-zoom-fade';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import MapboxGL from '@rnmapbox/maps';
import { useQuery } from 'convex/react';
import { memo, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface EventMarkerProps {
  id: string;
  coordinate: [number, number];
  label: string;
  mediaId: Id<'_storage'> | null;
  weight: number;
  minWeight: number;
  maxWeight: number;
  isActive?: boolean;
  zoom: SharedValue<number>;
  onPress: () => void;
}

export const EventMarker = memo(function EventMarker({
  id,
  coordinate,
  label,
  mediaId,
  weight,
  minWeight,
  maxWeight,
  isActive = true,
  zoom,
  onPress,
}: EventMarkerProps) {
  const file = useQuery(api.files.getFile, mediaId ? { storageId: mediaId } : 'skip');

  const t = (weight - minWeight) / (maxWeight - minWeight || 1);
  // inactive (past) events render at 70% size so active events dominate the map visually
  const size = (40 + t * 30) * (isActive ? 1 : 0.7);
  const stemWidth = size * 0.25;
  const stemHeight = size * 0.25;

  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = isActive
      ? withTiming(1, { duration: 300 })
      : withRepeat(withTiming(0.45, { duration: 1800 }), -1, true);
  }, [isActive, opacity]);

  const { fadeInZoom, fadeOutZoom } = markerFadeZooms(t);
  const zoomOpacity = useDerivedValue(() =>
    interpolate(zoom.value, [fadeOutZoom, fadeInZoom], [0, 1], Extrapolation.CLAMP)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * zoomOpacity.value,
  }));

  const borderClass = isActive ? 'border-primary' : 'border-muted-foreground';
  const stemColorClass = isActive ? 'border-t-primary' : 'border-t-muted-foreground';
  const fallbackBgClass = isActive ? 'bg-primary' : 'bg-muted';

  return (
    <MapboxGL.MarkerView
      id={id}
      coordinate={coordinate}
      allowOverlap
      allowOverlapWithPuck
      anchor={{ x: 0.5, y: 1 }}
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          className="items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
          >
            <View
              className={`border-2 ${borderClass}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: size / 2,
                zIndex: 1,
              }}
            />
            {file?.url ? (
              <Image source={file.url} className="h-full w-full rounded-full" contentFit="cover" />
            ) : (
              <View
                className={`h-full w-full items-center justify-center ${fallbackBgClass} rounded-full`}
              >
                <Text
                  style={{ fontSize: Math.round(size * 0.38), fontWeight: '700' }}
                  className="uppercase text-foreground"
                >
                  {label.trim().charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>

          <View
            className={`border-l-transparent border-r-transparent -z-1 ${stemColorClass}`}
            style={{
              width: 0,
              height: 0,
              marginTop: -5,
              borderLeftWidth: stemWidth,
              borderRightWidth: stemWidth,
              borderTopWidth: stemHeight,
            }}
          />
        </Pressable>
      </Animated.View>
    </MapboxGL.MarkerView>
  );
});
