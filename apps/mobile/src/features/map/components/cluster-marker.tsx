import { Image } from '@/components/image';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import MapboxGL from '@rnmapbox/maps';
import { useQuery } from 'convex/react';
import { Pressable, Text, View } from 'react-native';

interface ClusterMarkerProps {
  id: string;
  coordinate: [number, number];
  primaryLabel: string;
  primaryMediaId: Id<'_storage'> | null;
  count: number;
  weight: number;
  minWeight: number;
  maxWeight: number;
  onPress: () => void;
}

export function ClusterMarker({
  id,
  coordinate,
  primaryLabel,
  primaryMediaId,
  count,
  weight,
  minWeight,
  maxWeight,
  onPress,
}: ClusterMarkerProps) {
  const file = useQuery(api.files.getFile, primaryMediaId ? { storageId: primaryMediaId } : 'skip');

  const t = (weight - minWeight) / (maxWeight - minWeight || 1);
  const size = 44 + t * 44;
  const stemWidth = size * 0.28;
  const stemHeight = size * 0.22;
  const badgeSize = Math.max(20, size * 0.42);
  const extraCount = count - 1;

  return (
    <MapboxGL.MarkerView id={id} coordinate={coordinate} allowOverlap anchor={{ x: 0.5, y: 1 }}>
      <Pressable onPress={onPress} className="items-center">
        <View>
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
            {file?.url ? (
              <Image source={file.url} className="h-full w-full" contentFit="cover" />
            ) : (
              <View className="h-full w-full items-center justify-center bg-primary/10 px-2">
                <Text className="text-lg font-bold uppercase text-foreground">
                  {primaryLabel.trim().charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>

          <View
            className="absolute items-center justify-center rounded-full border-2 border-background bg-primary"
            style={{
              width: badgeSize,
              height: badgeSize,
              minWidth: badgeSize,
              right: -badgeSize * 0.25,
              top: -badgeSize * 0.25,
            }}
          >
            <Text className="px-1 text-xs font-bold text-primary-foreground">+{extraCount}</Text>
          </View>
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
