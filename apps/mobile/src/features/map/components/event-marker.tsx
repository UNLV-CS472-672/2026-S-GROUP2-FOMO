import { Image } from '@/components/image';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import MapboxGL from '@rnmapbox/maps';
import { useQuery } from 'convex/react';
import { Pressable, Text, View } from 'react-native';

interface EventMarkerProps {
  id: string;
  coordinate: [number, number];
  label: string;
  mediaId: Id<'_storage'> | null;
  // Raw attendee weight — same value passed to the heatmap layer (0–6 scale).
  weight: number;
  minWeight: number;
  maxWeight: number;
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
  onPress,
}: EventMarkerProps) {
  const eventImageUrl = useQuery(api.files.getUrl, mediaId ? { storageId: mediaId } : 'skip');

  // normalize against actual min/max so the full range is always used
  const t = (weight - minWeight) / (maxWeight - minWeight || 1);
  const size = 44 + t * 44;
  const stemWidth = size * 0.28;
  const stemHeight = size * 0.22;

  return (
    <MapboxGL.MarkerView id={id} coordinate={coordinate} allowOverlap anchor={{ x: 0.5, y: 1 }}>
      <Pressable onPress={onPress} className="items-center">
        <View
          className="overflow-hidden rounded-full border-2 border-primary bg-background shadow-sm"
          style={{
            width: size,
            height: size,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 10,
          }}
        >
          {eventImageUrl ? (
            <Image source={eventImageUrl} className="h-full w-full" contentFit="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-primary/10 px-2">
              <Text className="text-lg font-bold uppercase text-foreground">
                {label.trim().charAt(0) || '?'}
              </Text>
            </View>
          )}
        </View>

        <View
          className="-mt-px border-l-transparent border-r-transparent border-t-primary"
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: stemWidth / 2,
            borderRightWidth: stemWidth / 2,
            borderTopWidth: stemHeight,
          }}
        />
      </Pressable>
    </MapboxGL.MarkerView>
  );
}
