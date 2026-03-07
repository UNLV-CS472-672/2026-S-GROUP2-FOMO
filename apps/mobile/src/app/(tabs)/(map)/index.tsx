import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

// Las Vegas Coords, will change soon to grab user location
const defaultCoords: [number, number] = [-115.1398, 36.1699];

export default function MapScreen() {
  const { push } = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="absolute inset-0">
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL={MapboxGL.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={() => push('/feed/demo-cell')}
      >
        <MapboxGL.Camera centerCoordinate={defaultCoords} zoomLevel={13} animationMode="none" />
        <MapboxGL.UserLocation visible animated />
      </MapboxGL.MapView>

      {/* Search bar overlay */}
      <View className="absolute left-4 right-4" style={{ top: insets.top + 12 }}>
        <Pressable
          className="rounded-xl border border-white/[0.12] bg-[rgba(18,18,18,0.92)] px-4 py-3 active:bg-[rgba(38,38,38,0.92)]"
          onPress={() => push('/(tabs)/(map)/search')}
        >
          <Text className="text-[15px] text-white/40">Search places...</Text>
        </Pressable>
      </View>
    </View>
  );
}
