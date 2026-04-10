import { EventMarker } from '@/features/map/components/event-marker';
import { RecenterButton } from '@/features/map/components/recenter-button';
import { SearchDrawer } from '@/features/map/components/search';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { pointsToGeoJSON } from '@/features/map/utils/h3';
import { api } from '@fomo/backend/convex/_generated/api';
import { env } from '@fomo/env/mobile';
import { useIsFocused } from '@react-navigation/native';
import MapboxGL from '@rnmapbox/maps';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

MapboxGL.setAccessToken(env.EXPO_PUBLIC_MAPBOX_TOKEN);

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
  const events = useQuery(api.data_ml.events.getEvents) ?? [];
  const insets = useSafeAreaInsets();
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
        events.map((event) => ({
          latitude: event.location.latitude,
          longitude: event.location.longitude,
          weight: event.attendeeCount,
        }))
      ),
    [events]
  );

  const minWeight = useMemo(
    () => (events.length === 0 ? 0 : Math.min(...events.map((event) => event.attendeeCount))),
    [events]
  );
  const maxWeight = useMemo(
    () => (events.length === 0 ? 1 : Math.max(...events.map((event) => event.attendeeCount))),
    [events]
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

  // TODO: Add a map toggle to size icons by recommendation score or popularity.

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

        {events.map((event, i) => {
          const eventId = `event-${event.location.h3Index}-${i}`;
          return (
            <EventMarker
              key={eventId}
              id={eventId}
              coordinate={[event.location.longitude, event.location.latitude]}
              image={EVENT_IMAGES[i % EVENT_IMAGES.length]}
              weight={event.attendeeCount}
              minWeight={minWeight}
              maxWeight={maxWeight}
              onPress={() =>
                push({
                  pathname: '/feed/event/[h3Id]',
                  params: {
                    h3Id: event.location.h3Index,
                    eventData: JSON.stringify({
                      name: event.name,
                      organization: event.organization,
                      description: event.description,
                      attendeeCount: event.attendeeCount,
                      imageIndex: i % EVENT_IMAGES.length,
                    }),
                  },
                })
              }
            />
          );
        })}

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
