import { Icon } from '@/components/icon';
import { EventMarker } from '@/features/map/components/event-marker';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { coordsToH3Cell, pointsToGeoJSON } from '@/features/map/utils/h3';
import { eventSeedAttendees, eventSeeds } from '@fomo/backend/convex/seed';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const MIN_WEIGHT = Math.min(...eventSeedAttendees);
const MAX_WEIGHT = Math.max(...eventSeedAttendees);
const DEFAULT_ZOOM_LEVEL = 13;

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
      zoomLevel: DEFAULT_ZOOM_LEVEL,
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
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate,
            zoomLevel: DEFAULT_ZOOM_LEVEL,
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
            onPress={() => push(`/feed/event/${coordsToH3Cell(event.longitude, event.latitude)}`)}
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
        accessibilityLabel="Recenter map on your location"
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(0,0,0,0.08)', radius: 24 }}
        className="absolute right-4 size-12 items-center justify-center rounded-full bg-card shadow-sm"
        disabled={!hasResolvedLocation}
        hitSlop={10}
        style={({ pressed }) => [
          { bottom: insets.bottom + 88 },
          pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
          !hasResolvedLocation && { opacity: 0.55 },
        ]}
        onPress={() =>
          cameraRef.current?.setCamera({
            centerCoordinate,
            zoomLevel: DEFAULT_ZOOM_LEVEL,
            animationMode: 'flyTo',
            animationDuration: 800,
          })
        }
      >
        <Icon name="near-me" size={20} className="text-primary" />
      </Pressable>
    </View>
  );
}
