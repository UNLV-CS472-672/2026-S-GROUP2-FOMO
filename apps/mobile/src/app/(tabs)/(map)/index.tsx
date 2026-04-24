import type { EventSummary } from '@/features/events/types';
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
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

MapboxGL.setAccessToken(env.EXPO_PUBLIC_MAPBOX_TOKEN);

const DEFAULT_ZOOM_LEVEL = 13;

export default function MapScreen() {
  const { push } = useRouter();
  const events: EventSummary[] = useQuery(api.events.queries.getEvents) ?? [];
  const isFocused = useIsFocused();
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const savedCameraRef = useRef<{
    centerCoordinate: [number, number];
    zoomLevel: number;
    heading: number;
    pitch: number;
  } | null>(null);

  const {
    centerCoordinate,
    hasResolvedLocation,
    isResolvingLocation,
    locationError,
    locationGranted,
  } = useUserLocation();
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const drawerAnimatedIndex = useSharedValue(0);
  const drawerAnimatedPosition = useSharedValue(0);

  const heatmapGeoJSON = pointsToGeoJSON(
    events.map((event) => ({
      latitude: event.location.latitude,
      longitude: event.location.longitude,
      weight: event.attendeeCount,
    }))
  );
  const minWeight =
    events.length === 0 ? 0 : Math.min(...events.map((event) => event.attendeeCount));
  const maxWeight =
    events.length === 0 ? 1 : Math.max(...events.map((event) => event.attendeeCount));

  // TODO: Add a map toggle to size icons by recommendation score or popularity.

  if (!centerCoordinate) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        {isResolvingLocation ? (
          <>
            <ActivityIndicator />
          </>
        ) : (
          <Text className="text-center text-foreground">
            {locationError ?? 'Location access is required to use the map.'}
          </Text>
        )}
      </View>
    );
  }

  // use saved one (might happen mostly for switching theme and preserving camera)
  const initialCamera = savedCameraRef.current ?? {
    centerCoordinate,
    zoomLevel: DEFAULT_ZOOM_LEVEL,
    heading: 0,
    pitch: 0,
  };

  return (
    <View className="absolute inset-0">
      <MapboxGL.MapView
        key={isDark ? 'dark-map' : 'light-map'}
        style={StyleSheet.absoluteFill}
        styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
        onCameraChanged={(state) => {
          savedCameraRef.current = {
            centerCoordinate: state.properties.center as [number, number],
            zoomLevel: state.properties.zoom,
            heading: state.properties.heading,
            pitch: state.properties.pitch,
          };
        }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initialCamera.centerCoordinate,
            zoomLevel: initialCamera.zoomLevel,
            heading: initialCamera.heading,
            pitch: initialCamera.pitch,
          }}
        />

        {locationGranted && (
          <MapboxGL.LocationPuck
            puckBearing="heading"
            puckBearingEnabled
            pulsing={{ isEnabled: true, color: '#f59e0b', radius: 50 }}
          />
        )}

        {events.map((event) => (
          <EventMarker
            key={event.id}
            id={event.id}
            coordinate={[event.location.longitude, event.location.latitude]}
            label={event.name}
            mediaId={event.mediaId}
            weight={event.attendeeCount}
            minWeight={minWeight}
            maxWeight={maxWeight}
            onPress={() =>
              push({
                pathname: '/(tabs)/(map)/event/[eventId]',
                params: { eventId: event.id },
              })
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
        onSelectEvent={(eventId) => push(`/(tabs)/(map)/event/${eventId}`)}
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
