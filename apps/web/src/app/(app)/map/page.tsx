'use client';

import { MapEventFeedPanel } from '@/features/map/components/map-event-feed-panel';
import { MapSurface } from '@/features/map/components/map-surface';
import { RecenterButton } from '@/features/map/components/recenter-button';
import { useMapboxEventMap } from '@/features/map/hooks/use-mapbox-event-map';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { pointsToGeoJSON } from '@/features/map/utils/h3';
import { api } from '@fomo/backend/convex/_generated/api';
import { env } from '@fomo/env/web';
import { useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

const MAPBOX_TOKEN = env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const emptySubscribe = () => () => {};
type Events = NonNullable<FunctionReturnType<typeof api.events.queries.getEvents>>;
type MapEvent = Events[number];

export default function MapPage() {
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();
  const { resolvedTheme } = useTheme();
  const queriedEvents = useQuery(api.events.queries.getEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [markerImageUrls, setMarkerImageUrls] = useState<Record<string, string | null>>({});
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === 'dark';
  const events = useMemo(() => queriedEvents ?? [], [queriedEvents]);
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
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const heatmapGeoJSON = useMemo(
    () =>
      pointsToGeoJSON(
        events.map((event) => ({
          longitude: event.location.longitude,
          latitude: event.location.latitude,
          weight: event.attendeeCount,
        }))
      ),
    [events]
  );

  const { loadError, mapContainerRef, mapReady, recenterMap } = useMapboxEventMap({
    centerCoordinate,
    events: eventsWithMarkerImages,
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
    return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${lng},${lat},13,0/1400x900?access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
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
  const file = useQuery(api.files.getFile, event.mediaId ? { storageId: event.mediaId } : 'skip');

  useEffect(() => {
    if (!event.mediaId) {
      onResolve(event.id, null);
      return;
    }

    if (file === undefined) {
      return;
    }

    onResolve(event.id, file.isVideo ? null : (file.url ?? null));
  }, [event.id, event.mediaId, file, onResolve]);

  return null;
}
