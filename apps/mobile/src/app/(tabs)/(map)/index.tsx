import { EventMarker } from '@/features/map/components/event-marker';
import { RecenterButton } from '@/features/map/components/recenter-button';
import { SearchDrawer } from '@/features/map/components/search';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { coordsToH3Cell, pointsToGeoJSON } from '@/features/map/utils/h3';
import { eventSeedAttendees, eventSeeds } from '@fomo/backend/convex/seed';
import { env } from '@fomo/env/mobile';
import { useIsFocused } from '@react-navigation/native';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

MapboxGL.setAccessToken(env.EXPO_PUBLIC_MAPBOX_TOKEN);

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
  const isFocused = useIsFocused();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const drawerAnimatedIndex = useSharedValue(0);
  const drawerAnimatedPosition = useSharedValue(0);

  const heatmapGeoJSON = useMemo(
    () =>
      pointsToGeoJSON(
        eventSeeds.map((e, i) => ({
          latitude: e.location.latitude,
          longitude: e.location.longitude,
          weight: eventSeedAttendees[i] ?? 1,
        }))
      ),
    []
  );

  useEffect(() => {
    if (!hasResolvedLocation) return;

    cameraRef.current?.setCamera({
      centerCoordinate,
      zoomLevel: DEFAULT_ZOOM_LEVEL,
      heading: 0,
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
            heading: 0,
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
            coordinate={[event.location.longitude, event.location.latitude]}
            image={EVENT_IMAGES[i % EVENT_IMAGES.length]}
            weight={eventSeedAttendees[i] ?? 1}
            minWeight={MIN_WEIGHT}
            maxWeight={MAX_WEIGHT}
            onPress={() =>
              push(
                `/feed/event/${coordsToH3Cell(event.location.longitude, event.location.latitude)}`
              )
            }
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

      <SearchDrawer
        onSelectEvent={(h3Id) => push(`/feed/event/${h3Id}`)}
        animatedIndex={drawerAnimatedIndex}
        animatedPosition={drawerAnimatedPosition}
        isFocused={isFocused}
      />

      <RecenterButton
        disabled={!hasResolvedLocation}
        animatedIndex={drawerAnimatedIndex}
        animatedPosition={drawerAnimatedPosition}
        onPress={() =>
          cameraRef.current?.setCamera({
            centerCoordinate,
            zoomLevel: DEFAULT_ZOOM_LEVEL,
            heading: 0,
            animationMode: 'flyTo',
            animationDuration: 800,
          })
        }
      />
    </View>
  );
}
