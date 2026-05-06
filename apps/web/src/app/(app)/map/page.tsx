'use client';

import { FeedTabs, type FeedMode } from '@/features/map/components/feed-tabs';
import { MapEventFeedPanel } from '@/features/map/components/map-event-feed-panel';
import { MapSurface } from '@/features/map/components/map-surface';
import { RecenterButton } from '@/features/map/components/recenter-button';
import { useMapboxEventMap } from '@/features/map/hooks/use-mapbox-event-map';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { pointsToGeoJSON } from '@/features/map/utils/h3';
import { useAuth } from '@clerk/nextjs';
import { api } from '@fomo/backend/convex/_generated/api';
import { env } from '@fomo/env/web';
import { useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

const MAPBOX_TOKEN = env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const emptySubscribe = () => () => {};
const STATIC_MAP_WIDTH = 1280;
const STATIC_MAP_HEIGHT = 900;
type InternalEvents = NonNullable<FunctionReturnType<typeof api.events.queries.getEvents>>;
type ExternalEvents = NonNullable<FunctionReturnType<typeof api.events.queries.getExternalEvents>>;
type InternalMapEvent = InternalEvents[number] & { markerImageUrl?: string | null };
type ExternalMapEvent = ExternalEvents[number] & { markerImageUrl?: string | null };
type MapEvent = InternalMapEvent | ExternalMapEvent;

export default function MapPage() {
  const { isSignedIn } = useAuth();
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();
  const { resolvedTheme } = useTheme();
  const queriedEvents = useQuery(api.events.queries.getEvents);
  const queriedExternalEvents = useQuery(api.events.queries.getExternalEvents);
  const [feedMode, setFeedMode] = useState<FeedMode>('foryou');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [markerImageUrls, setMarkerImageUrls] = useState<Record<string, string | null>>({});
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === 'dark';
  const internalEvents = useMemo(() => queriedEvents ?? [], [queriedEvents]);
  const externalEvents = useMemo(() => queriedExternalEvents ?? [], [queriedExternalEvents]);
  const events = useMemo(
    () => [...internalEvents, ...externalEvents] as MapEvent[],
    [internalEvents, externalEvents]
  );

  useEffect(() => {
    if (queriedEvents === undefined) {
      return;
    }
    console.log('[map] events received', queriedEvents);
  }, [queriedEvents]);

  const handleResolveMarkerImage = useCallback((eventId: string, imageUrl: string | null) => {
    setMarkerImageUrls((current) =>
      current[eventId] === imageUrl ? current : { ...current, [eventId]: imageUrl }
    );
  }, []);
  const eventsWithMarkerImages = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        markerImageUrl: markerImageUrls[event.id] ?? null,
      })),
    [events, markerImageUrls]
  );
  const selectedEvent = useMemo(
    () => eventsWithMarkerImages.find((event) => event.id === selectedEventId) ?? null,
    [eventsWithMarkerImages, selectedEventId]
  );

  // `getEvents` includes recommendation scores when available. For "For You", prioritize
  // higher scores and otherwise keep backend order for stable fallback behavior.
  // External events don't have recommendationScore so they sort to the end.
  const visibleEvents = useMemo(() => {
    if (feedMode === 'popular') {
      return [...eventsWithMarkerImages].sort((a, b) => b.attendeeCount - a.attendeeCount);
    }
    return [...eventsWithMarkerImages].sort(
      (a, b) =>
        (('recommendationScore' in b ? b.recommendationScore : null) ?? 0) -
        (('recommendationScore' in a ? a.recommendationScore : null) ?? 0)
    );
  }, [eventsWithMarkerImages, feedMode]);

  // In "For You", weight by ranked order in the already-sorted visible list.
  const eventWeights = useMemo(() => {
    if (feedMode === 'foryou' && visibleEvents.length > 0) {
      const k = visibleEvents.length;
      return new Map<string, number>(visibleEvents.map((event, index) => [event.id, k - index]));
    }
    return new Map<string, number>(events.map((event) => [event.id, event.attendeeCount]));
  }, [events, feedMode, visibleEvents]);

  const heatmapGeoJSON = useMemo(
    () =>
      pointsToGeoJSON(
        visibleEvents.map((e) => ({
          longitude: e.location.longitude,
          latitude: e.location.latitude,
          weight: eventWeights.get(e.id) ?? 0,
        }))
      ),
    [eventWeights, visibleEvents]
  );

  // The hook scales markers from `attendeeCount`; in 'foryou' we override it with the
  // rank-based weight so #1 rec is biggest, #K smallest.
  const weightedVisibleEvents = useMemo(
    () => visibleEvents.map((e) => ({ ...e, attendeeCount: eventWeights.get(e.id) ?? 0 })),
    [visibleEvents, eventWeights]
  );

  const { loadError, mapContainerRef, mapReady, recenterMap } = useMapboxEventMap({
    centerCoordinate,
    events: weightedVisibleEvents,
    hasResolvedLocation,
    heatmapGeoJSON,
    isDark,
    locationGranted,
    mapboxToken: MAPBOX_TOKEN,
    onSelectEvent: (eventId) => {
      setSelectedEventId(eventId);
    },
  });

  const staticMapSrc = useMemo(() => {
    if (!mounted || !MAPBOX_TOKEN) {
      return '';
    }

    const styleId = isDark ? 'dark-v11' : 'streets-v12';
    const [lng, lat] = centerCoordinate;
    return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${lng},${lat},13,0/${STATIC_MAP_WIDTH}x${STATIC_MAP_HEIGHT}?access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
  }, [centerCoordinate, isDark, mounted]);

  return (
    <>
      <MapSurface
        mapContainerRef={mapContainerRef}
        mapReady={mapReady}
        loadError={loadError}
        staticMapSrc={staticMapSrc}
      />

      {events.map((event) => (
        <EventMarkerImageResolver
          key={event.id}
          event={event}
          onResolve={handleResolveMarkerImage}
        />
      ))}

      <RecenterButton
        disabled={!locationGranted}
        offsetForEventPanel={selectedEvent !== null}
        onClick={recenterMap}
      />

      {isSignedIn && <FeedTabs value={feedMode} onChange={setFeedMode} />}

      <MapEventFeedPanel event={selectedEvent} onClose={() => setSelectedEventId(null)} />
    </>
  );
}

function EventMarkerImageResolver({
  event,
  onResolve,
}: {
  event: MapEvent;
  onResolve: (eventId: string, imageUrl: string | null) => void;
}) {
  const mediaId = 'mediaId' in event ? event.mediaId : null;
  const file = useQuery(api.files.getFile, mediaId ? { storageId: mediaId } : 'skip');

  useEffect(() => {
    if (!mediaId) {
      onResolve(event.id, null);
      return;
    }

    if (file === undefined) {
      return;
    }

    onResolve(event.id, file.isVideo ? null : (file.url ?? null));
  }, [event.id, mediaId, file, onResolve]);

  return null;
}
