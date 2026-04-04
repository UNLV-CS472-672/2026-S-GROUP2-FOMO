import MapboxGL from '@rnmapbox/maps';
import { Image, ImageSourcePropType, Pressable, View } from 'react-native';

interface EventMarkerProps {
  id: string;
  coordinate: [number, number];
  image: ImageSourcePropType;
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
  image,
  weight,
  minWeight,
  maxWeight,
  onPress,
}: EventMarkerProps) {
  // normalize against actual min/max so the full range is always used
  const t = (weight - minWeight) / (maxWeight - minWeight || 1);
  const size = 44 + t * 44;
  const stemWidth = size * 0.28;
  const stemHeight = size * 0.22;

  return (
    <MapboxGL.MarkerView id={id} coordinate={coordinate} allowOverlap anchor={{ x: 0.5, y: 1 }}>
      <Pressable onPress={onPress} style={{ alignItems: 'center' }}>
        {/* Hover shadow + circle */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2.5,
            borderColor: '#FF6B47',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 10,
          }}
        >
          <Image source={image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>

        {/* Stem triangle */}
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: stemWidth / 2,
            borderRightWidth: stemWidth / 2,
            borderTopWidth: stemHeight,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: '#FF6B47',
            marginTop: -1,
          }}
        />
      </Pressable>
    </MapboxGL.MarkerView>
  );
}
