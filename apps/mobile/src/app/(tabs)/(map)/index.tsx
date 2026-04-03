import { EventMarker } from '@/features/map/components/event-marker';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { coordsToH3Cell, pointsToGeoJSON } from '@/features/map/utils/h3';
import { eventSeedAttendees, eventSeeds } from '@fomo/backend/convex/seed';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import type { Point } from 'geojson';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

export default function MapScreen() {
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();
  const { theme } = useUniwind();
  const isDark = theme === 'dark';

  const heatmapGeoJSON = useMemo(
    () => pointsToGeoJSON(eventSeeds.map((e, i) => ({ ...e, weight: eventSeedAttendees[i] ?? 1 }))),
    []
  );

  useEffect(() => {
    if (!hasResolvedLocation) return;

    cameraRef.current?.setCamera({
      centerCoordinate,
      zoomLevel: 13,
      animationMode: 'flyTo',
      animationDuration: 1200,
    });
  }, [centerCoordinate, hasResolvedLocation]);

  return (
    <View className="absolute inset-0">
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
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
          defaultSettings={{
            centerCoordinate,
            zoomLevel: 13,
          }}
        />
        {locationGranted && (
          <MapboxGL.LocationPuck
            puckBearing="heading"
            puckBearingEnabled
            pulsing={{ isEnabled: true, color: '#f59e0b', radius: 50 }}
          />
        )}

        {eventSeeds.map((event, i) => (
          <EventMarker
            key={event.name}
            id={`event-${i}`}
            coordinate={[event.longitude, event.latitude]}
            name={event.name}
            weight={eventSeedAttendees[i] ?? 1}
            onPress={() => push(`/feed/${coordsToH3Cell(event.longitude, event.latitude)}`)}
          />
        ))}

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
          className="rounded-xl border border-border/80 bg-card/95 px-4 py-3"
          onPress={() => push('/(tabs)/(map)/search')}
        >
          <Text className="text-[15px] text-muted-foreground">Search places...</Text>
        </Pressable>
      </View>

      {/* Recenter button */}
      <Pressable
        className="absolute right-4 items-center justify-center rounded-full border border-border/80 bg-card/95"
        style={{ bottom: insets.bottom + 24, width: 44, height: 44 }}
        onPress={() =>
          cameraRef.current?.setCamera({
            centerCoordinate,
            zoomLevel: 13,
            animationMode: 'flyTo',
            animationDuration: 800,
          })
        }
      >
        <Text style={{ fontSize: 20 }}>⌖</Text>
      </Pressable>
    </View>
  );
}
