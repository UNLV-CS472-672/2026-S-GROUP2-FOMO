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
    <View style={StyleSheet.absoluteFill}>
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
      <View style={[styles.searchBar, { top: insets.top + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}
          onPress={() => push('/(tabs)/(map)/search')}
        >
          <Text style={styles.searchText}>Search places...</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    left: 16,
    position: 'absolute',
    right: 16,
  },
  searchButton: {
    backgroundColor: 'rgba(18, 18, 18, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchButtonPressed: {
    backgroundColor: 'rgba(38, 38, 38, 0.92)',
  },
  searchText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 15,
  },
});
