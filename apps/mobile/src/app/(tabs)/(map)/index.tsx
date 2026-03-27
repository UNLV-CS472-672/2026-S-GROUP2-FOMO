import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { coordsToH3Cell, pointsToGeoJSON } from '@/features/map/utils/h3';
import { eventSeedAttendees, eventSeeds } from '@fomo/backend/convex/seed';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import type { Point } from 'geojson';
import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

export default function MapScreen() {
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();

  const heatmapGeoJSON = useMemo(
    () => pointsToGeoJSON(eventSeeds.map((e, i) => ({ ...e, weight: eventSeedAttendees[i] ?? 1 }))),
    []
  );

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
            pulsing={{ isEnabled: true, color: '#f59e0b', radius: 50 }}
          />
        )}

        <MapboxGL.ShapeSource id="activity" shape={heatmapGeoJSON}>
          <MapboxGL.HeatmapLayer
            id="activity-heat"
            style={{
              heatmapWeight: ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 6, 1],
              heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 3],
              heatmapColor: [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(0,0,0,0)',
                0.2,
                'rgba(245,158,11,0.3)',
                0.5,
                'rgba(245,158,11,0.6)',
                0.8,
                'rgba(245,158,11,0.85)',
                1,
                'rgba(255,255,255,0.95)',
              ],
              heatmapRadius: ['interpolate', ['linear'], ['zoom'], 10, 30, 15, 60],
              heatmapOpacity: ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 0.6],
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
