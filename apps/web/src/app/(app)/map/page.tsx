'use client';

import { MapSurface } from '@/features/map/components/map-surface';
import { RecenterButton } from '@/features/map/components/recenter-button';
import { useMapboxEventMap } from '@/features/map/hooks/use-mapbox-event-map';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { pointsToGeoJSON } from '@/features/map/utils/h3';
import { api } from '@fomo/backend/convex/_generated/api';
import { env } from '@fomo/env/web';
import { useQuery } from 'convex/react';
import { useTheme } from 'next-themes';
import { useMemo, useSyncExternalStore } from 'react';

const MAPBOX_TOKEN = env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const emptySubscribe = () => () => {};

export default function MapPage() {
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();
  const { resolvedTheme } = useTheme();
  const queriedEvents = useQuery(api.data_ml.events.getEvents);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === 'dark';
  const events = useMemo(() => queriedEvents ?? [], [queriedEvents]);

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
    events,
    hasResolvedLocation,
    heatmapGeoJSON,
    isDark,
    locationGranted,
    mapboxToken: MAPBOX_TOKEN,
    onSelectEvent: (eventId) => {
      console.log('eventId', eventId);
      alert('TODO: make sidebar w/ event details feed');
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

      <RecenterButton disabled={!locationGranted} onClick={recenterMap} />
    </>
  );
}
