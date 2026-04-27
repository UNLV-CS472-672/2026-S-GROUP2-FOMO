import type { EventSummary } from '@/features/events/types';
import { EventMarker } from '@/features/map/components/event-marker';
import { FeedTabs, type FeedMode } from '@/features/map/components/feed-tabs';
import { RecenterButton } from '@/features/map/components/recenter-button';
import { SearchDrawer } from '@/features/map/components/search';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { pointsToGeoJSON } from '@/features/map/utils/h3';
import { useUser } from '@clerk/expo';
import { api } from '@fomo/backend/convex/_generated/api';
import { env } from '@fomo/env/mobile';
import { useIsFocused } from '@react-navigation/native';
import MapboxGL from '@rnmapbox/maps';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

MapboxGL.setAccessToken(env.EXPO_PUBLIC_MAPBOX_TOKEN);

const DEFAULT_ZOOM_LEVEL = 13;

export default function MapScreen() {
  const { push } = useRouter();
  const { isSignedIn } = useUser();
  const events: EventSummary[] = useQuery(api.events.queries.getEvents) ?? [];
  const eventRecs = useQuery(
    api.data_ml.eventRec.getCurrentUserEventRecs,
    isSignedIn ? {} : 'skip'
  );
  const isFocused = useIsFocused();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>('foryou');

  // 'popular' sorts by attendance (objective). 'foryou' uses the Two-Tower top-K recs in
  // rank order (index 0 = #1 rec); we use array order rather than score because the model's
  // probabilities aren't comparable across users (PR #140). Falls back to the full event
  // list when recs haven't been computed for this user yet.
  const visibleEvents = useMemo(() => {
    if (feedMode === 'popular') {
      return [...events].sort((a, b) => b.attendeeCount - a.attendeeCount);
    }
    if (eventRecs && eventRecs.length > 0) {
      const eventById = new Map(events.map((event) => [event.id, event]));
      return eventRecs
        .map((rec) => eventById.get(rec.eventId))
        .filter((event): event is EventSummary => event !== undefined);
    }
    return events;
  }, [events, eventRecs, feedMode]);

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

  // In 'foryou' with recs, weight by inverse rank (#1 rec = K, #K = 1) so visual scale is
  // comparable across users — model probabilities aren't (PR #140). Otherwise use attendance.
  const eventWeights = useMemo(() => {
    if (feedMode === 'foryou' && eventRecs && eventRecs.length > 0) {
      const k = eventRecs.length;
      return new Map(eventRecs.map((rec, index) => [rec.eventId, k - index]));
    }
    return new Map(events.map((event) => [event.id, event.attendeeCount]));
  }, [events, eventRecs, feedMode]);

  const getWeight = (eventId: EventSummary['id']) => eventWeights.get(eventId) ?? 0;

  const heatmapGeoJSON = pointsToGeoJSON(
    visibleEvents.map((event) => ({
      latitude: event.location.latitude,
      longitude: event.location.longitude,
      weight: getWeight(event.id),
    }))
  );
  const visibleWeights = visibleEvents.map((event) => getWeight(event.id));
  const minWeight = visibleWeights.length === 0 ? 0 : Math.min(...visibleWeights);
  const maxWeight = visibleWeights.length === 0 ? 1 : Math.max(...visibleWeights);

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

        {visibleEvents.map((event) => (
          <EventMarker
            key={event.id}
            id={event.id}
            coordinate={[event.location.longitude, event.location.latitude]}
            label={event.name}
            mediaId={event.mediaId}
            weight={getWeight(event.id)}
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

      <FeedTabs value={feedMode} onChange={setFeedMode} />
    </View>
  );
}
