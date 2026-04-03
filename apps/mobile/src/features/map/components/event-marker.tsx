import MapboxGL from '@rnmapbox/maps';
import { Pressable, Text, View } from 'react-native';

interface EventMarkerProps {
  id: string;
  coordinate: [number, number];
  name: string;
  weight: number;
  onPress: () => void;
}

// Extracts up to 2 initials from an event name (e.g. "Baby Keem Concert" → "BK").
function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// Renders a map pin styled to match the heatmap.
// Opacity and size scale with the same 0–6 weight used by the heatmap layer.
export function EventMarker({ id, coordinate, name, weight, onPress }: EventMarkerProps) {
  // Normalize to 0–1 using the same max weight (6) as the heatmap weight expression.
  const t = Math.min(weight / 6, 1);
  const size = 32 + t * 40;
  const opacity = 0.3 + t * 0.7;

  return (
    <MapboxGL.MarkerView id={id} coordinate={coordinate} allowOverlap anchor={{ x: 0.5, y: 0.5 }}>
      <Pressable onPress={onPress}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1 + t * 2,
            borderColor: `rgba(245,158,11,${opacity})`,
            backgroundColor: `rgba(245,158,11,${opacity * 0.25})`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: `rgba(245,158,11,${opacity})`,
              fontWeight: '700',
              fontSize: 10 + t * 6,
            }}
            numberOfLines={1}
          >
            {getInitials(name)}
          </Text>
        </View>
      </Pressable>
    </MapboxGL.MarkerView>
  );
}
