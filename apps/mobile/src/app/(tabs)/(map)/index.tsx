import type { EventSummary, ExternalEventSummary } from '@/features/events/types';
import { ClusterMarker } from '@/features/map/components/cluster-marker';
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
  const eventsRaw = useQuery(api.events.queries.getEvents);
  const externalEventsRaw = useQuery(api.events.queries.getExternalEvents);
  const events: EventSummary[] = useMemo(() => eventsRaw ?? [], [eventsRaw]);
  const externalEvents: ExternalEventSummary[] = useMemo(
    () => externalEventsRaw ?? [],
    [externalEventsRaw]
  );
  const allEvents = useMemo(() => [...events, ...externalEvents], [events, externalEvents]);
  const isFocused = useIsFocused();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>('foryou');
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);
  const zoomShared = useSharedValue(DEFAULT_ZOOM_LEVEL);
  const CLUSTER_DISABLE_ZOOM = 15;

  // `getEvents` includes recommendation scores when available. For "For You", prioritize
  // higher scores and otherwise keep backend order for stable fallback behavior.
  const visibleEvents = useMemo(() => {
    if (feedMode === 'popular') {
      return [...allEvents].sort((a, b) => b.attendeeCount - a.attendeeCount);
    }
    // For You: internal events sorted by recommendation score, external events appended
    const sortedInternal = [...events].sort(
      (a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0)
    );
    return [...sortedInternal, ...externalEvents];
  }, [allEvents, events, externalEvents, feedMode]);

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

  // In "For You", weight by ranked order in the already-sorted visible list.
  const eventWeights = useMemo(() => {
    if (feedMode === 'foryou' && visibleEvents.length > 0) {
      const k = visibleEvents.length;
      return new Map(visibleEvents.map((event, index) => [event.id, k - index]));
    }
    return new Map(allEvents.map((event) => [event.id, event.attendeeCount]));
  }, [allEvents, visibleEvents, feedMode]);

  const getWeight = (eventId: EventSummary['id'] | ExternalEventSummary['id']) =>
    eventWeights.get(eventId) ?? 0;

  const heatmapGeoJSON = pointsToGeoJSON(
    visibleEvents.map((event) => ({
      latitude: event.location.latitude,
      longitude: event.location.longitude,
      weight: getWeight(event.id),
    }))
  );

  // Group events by H3 cell so co-located events render as a single cluster marker.
  // Above CLUSTER_DISABLE_ZOOM each event renders individually so users can tap them.
  const eventClusters = useMemo(() => {
    const now = Date.now();
    const shouldCluster = zoomLevel < CLUSTER_DISABLE_ZOOM;

    if (!shouldCluster) {
      // Group by H3 so co-located events get spread into a circle rather than stacking.
      const groups = new Map<string, (EventSummary | ExternalEventSummary)[]>();
      for (const event of visibleEvents) {
        const key = event.location.h3Index;
        const existing = groups.get(key);
        if (existing) existing.push(event);
        else groups.set(key, [event]);
      }
      const SPREAD_DEG = 0.0003; // ~30m spread radius
      const result: {
        h3Index: string;
        members: (EventSummary | ExternalEventSummary)[];
        primary: EventSummary | ExternalEventSummary;
        secondary: null;
        count: number;
        weight: number;
        isActive: boolean;
        coordinate: [number, number];
      }[] = [];
      for (const [h3Index, members] of groups.entries()) {
        members.forEach((event, i) => {
          const angle = (2 * Math.PI * i) / members.length;
          const offsetLng = members.length > 1 ? Math.cos(angle) * SPREAD_DEG : 0;
          const offsetLat = members.length > 1 ? Math.sin(angle) * SPREAD_DEG : 0;
          result.push({
            h3Index: event.id,
            members: [event],
            primary: event,
            secondary: null,
            count: 1,
            weight: getWeight(event.id),
            isActive: event.endDate >= now,
            coordinate: [event.location.longitude + offsetLng, event.location.latitude + offsetLat],
          });
        });
      }
      return result;
    }

    const groups = new Map<string, (EventSummary | ExternalEventSummary)[]>();
    for (const event of visibleEvents) {
      const key = event.location.h3Index;
      const existing = groups.get(key);
      if (existing) {
        existing.push(event);
      } else {
        groups.set(key, [event]);
      }
    }
    return Array.from(groups.entries()).map(([h3Index, members]) => {
      const sorted = [...members].sort((a, b) => getWeight(b.id) - getWeight(a.id));
      const primary = sorted[0];
      const secondary = sorted[1] ?? null;
      const totalWeight = members.reduce((sum, e) => sum + getWeight(e.id), 0);
      const isActive = members.some((e) => e.endDate >= now);
      return {
        h3Index,
        members,
        primary,
        secondary,
        count: members.length,
        weight: totalWeight,
        isActive,
      };
    });
  }, [visibleEvents, eventWeights, zoomLevel]);

  const clusterWeights = eventClusters.map((c) => c.weight);
  const minWeight = clusterWeights.length === 0 ? 0 : Math.min(...clusterWeights);
  const maxWeight = clusterWeights.length === 0 ? 1 : Math.max(...clusterWeights);

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
          setZoomLevel(state.properties.zoom);
          zoomShared.value = state.properties.zoom;
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
            pulsing={{ isEnabled: true, color: '#ff7f50', radius: 25 }}
          />
        )}

        {eventClusters.map((cluster) => {
          const { primary, count, weight, isActive } = cluster;
          const coordinate: [number, number] =
            'coordinate' in cluster
              ? cluster.coordinate
              : [primary.location.longitude, primary.location.latitude];
          if (count === 1) {
            return (
              <EventMarker
                key={primary.id}
                id={primary.id}
                coordinate={coordinate}
                label={primary.name}
                mediaId={primary.mediaId}
                weight={weight}
                minWeight={minWeight}
                maxWeight={maxWeight}
                isActive={isActive}
                zoom={zoomShared}
                onPress={() => {
                  if ('externalKey' in primary) {
                    push({
                      pathname: '/(tabs)/(map)/external-event/[eventId]',
                      params: { eventId: primary.id },
                    });
                  } else {
                    push({
                      pathname: '/(tabs)/(map)/event/[eventId]',
                      params: { eventId: primary.id },
                    });
                  }
                }}
              />
            );
          }
          const { secondary } = cluster;
          return (
            <ClusterMarker
              key={cluster.h3Index}
              id={cluster.h3Index}
              coordinate={coordinate}
              primaryLabel={primary.name}
              primaryMediaId={primary.mediaId}
              secondaryLabel={secondary?.name ?? null}
              secondaryMediaId={secondary?.mediaId ?? null}
              count={count}
              weight={weight}
              minWeight={minWeight}
              maxWeight={maxWeight}
              isActive={isActive}
              zoom={zoomShared}
              onPress={() => {
                if ('externalKey' in primary) {
                  push({
                    pathname: '/(tabs)/(map)/external-event/[eventId]',
                    params: { eventId: primary.id },
                  });
                } else {
                  push({
                    pathname: '/(tabs)/(map)/event/[eventId]',
                    params: { eventId: primary.id },
                  });
                }
              }}
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
                'rgba(255,120,0,0)',
                0.1,
                'rgba(255,150,50,0.2)',
                0.4,
                'rgba(255,120,0,0.6)',
                0.7,
                'rgba(255,80,0,0.85)',
                1,
                'rgba(255,60,0,1)',
              ],
              heatmapRadius: ['interpolate', ['linear'], ['zoom'], 10, 30, 15, 60],
              heatmapOpacity: ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 0.6],
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>

      {isSignedIn && <FeedTabs value={feedMode} onChange={setFeedMode} />}

      <SearchDrawer
        onSelectEvent={(eventId) => push(`/(tabs)/(map)/event/${eventId}`)}
        onSelectLocation={({ longitude, latitude }) =>
          cameraRef.current?.setCamera({
            centerCoordinate: [longitude, latitude],
            zoomLevel: DEFAULT_ZOOM_LEVEL,
            animationMode: 'flyTo',
            animationDuration: 800,
          })
        }
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
