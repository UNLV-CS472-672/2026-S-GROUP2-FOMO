import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { activityToGeoJSON, coordsToH3Cell } from '@/features/map/utils/h3';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import type { Point } from 'geojson';
import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// replace with reformatted schema data soon
const tempMockData = [
  { h3Index: coordsToH3Cell(-115.1398, 36.1699), count: 42 }, // Downtown LV / First Friday
  { h3Index: coordsToH3Cell(-115.144, 36.108), count: 18 }, // UNLV campus
  { h3Index: coordsToH3Cell(-115.205, 36.132), count: 31 }, // Chinatown
  { h3Index: coordsToH3Cell(-115.173, 36.1126), count: 55 }, // Cosmopolitan / Strip
  { h3Index: coordsToH3Cell(-115.1161, 36.0629), count: 9 }, // Sunset Park
  { h3Index: coordsToH3Cell(-115.152, 36.13), count: 24 }, // Convention Center
  { h3Index: coordsToH3Cell(-115.141, 36.107), count: 14 }, // Pop Cafe area
];

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

export default function MapScreen() {
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();

  const activityGeoJSON = useMemo(() => activityToGeoJSON(tempMockData), []);

  return (
    <View className="absolute inset-0">
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL={MapboxGL.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
        onPress={(feature) => {
          const [lng, lat] = (feature.geometry as Point).coordinates;
          push(`/feed/${coordsToH3Cell(lng, lat)}`);
        }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={centerCoordinate}
          zoomLevel={13}
          animationMode={hasResolvedLocation ? 'flyTo' : 'none'}
          animationDuration={1200}
        />
        {locationGranted && (
          <MapboxGL.LocationPuck
            puckBearing="heading"
            puckBearingEnabled
            pulsing={{ isEnabled: true, color: '#4A90D9', radius: 50 }}
          />
        )}

        <MapboxGL.ShapeSource id="activity" shape={activityGeoJSON}>
          <MapboxGL.FillLayer
            id="h3-fill"
            style={{
              fillColor: [
                'interpolate',
                ['linear'],
                ['get', 'count'],
                0,
                'rgba(74, 144, 217, 0.15)',
                20,
                'rgba(245, 166, 35, 0.40)',
                50,
                'rgba(255, 59, 48,  0.65)',
              ],
              fillOpacity: ['step', ['zoom'], 0, 10, 1],
            }}
          />
          <MapboxGL.LineLayer
            id="h3-border"
            style={{
              lineColor: 'rgba(255, 255, 255, 0.25)',
              lineWidth: 0.8,
              lineOpacity: ['step', ['zoom'], 0, 10, 1],
            }}
          />
        </MapboxGL.ShapeSource>
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
