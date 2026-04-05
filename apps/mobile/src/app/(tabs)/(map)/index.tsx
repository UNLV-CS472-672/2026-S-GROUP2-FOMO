import { EventMarker } from '@/features/map/components/event-marker';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { coordsToH3Cell, pointsToGeoJSON } from '@/features/map/utils/h3';
import { MaterialIcons } from '@expo/vector-icons';
import { eventSeedAttendees, eventSeeds } from '@fomo/backend/convex/seed';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import type { Point } from 'geojson';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const MIN_WEIGHT = Math.min(...eventSeedAttendees);
const MAX_WEIGHT = Math.max(...eventSeedAttendees);

// hardcoded from feed
const EVENT_IMAGES = [
  require('@/assets/images/rigrig.jpg'),
  require('@/assets/images/jonah-mog.png'),
  require('@/assets/images/git-learning-class.png'),
  require('@/assets/images/rate-my-date.jpg'),
];

export default function MapScreen() {
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();
  const { height: screenHeight } = useWindowDimensions();
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
            image={EVENT_IMAGES[i % EVENT_IMAGES.length]}
            weight={eventSeedAttendees[i] ?? 1}
            minWeight={MIN_WEIGHT}
            maxWeight={MAX_WEIGHT}
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
        style={{ bottom: insets.bottom + screenHeight * 0.1, width: 48, height: 48 }}
        onPress={() =>
          cameraRef.current?.setCamera({
            centerCoordinate,
            zoomLevel: 13,
            animationMode: 'flyTo',
            animationDuration: 800,
          })
        }
      >
        <MaterialIcons name="near-me" size={22} color="#f59e0b" />
      </Pressable>
    </View>
  );
}
