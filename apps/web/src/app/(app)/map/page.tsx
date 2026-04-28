'use client';

import { FeedTabs, type FeedMode } from '@/features/map/components/feed-tabs';
import { MapSurface } from '@/features/map/components/map-surface';
import { RecenterButton } from '@/features/map/components/recenter-button';
import { useMapboxEventMap } from '@/features/map/hooks/use-mapbox-event-map';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { pointsToGeoJSON } from '@/features/map/utils/h3';
import { useUser } from '@clerk/nextjs';
import { api } from '@fomo/backend/convex/_generated/api';
import { env } from '@fomo/env/web';
import { useQuery } from 'convex/react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useSyncExternalStore } from 'react';

const MAPBOX_TOKEN = env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const emptySubscribe = () => () => {};

export default function MapPage() {
  const router = useRouter();
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();
  const { resolvedTheme } = useTheme();
  const { isSignedIn } = useUser();
  const events = useQuery(api.events.queries.getEvents) ?? [];
  const eventRecs = useQuery(
    api.data_ml.eventRec.getCurrentUserEventRecs,
    isSignedIn ? {} : 'skip'
  );
  const [feedMode, setFeedMode] = useState<FeedMode>('foryou');
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === 'dark';

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
        .map((id) => eventById.get(id))
        .filter((event): event is NonNullable<typeof event> => event !== undefined);
    }
    return events;
  }, [events, eventRecs, feedMode]);

  // In 'foryou' with recs, weight by inverse rank (#1 rec = K, #K = 1) so visual scale is
  // comparable across users — model probabilities aren't (PR #140). Otherwise use attendance.
  const eventWeights = useMemo(() => {
    if (feedMode === 'foryou' && eventRecs && eventRecs.length > 0) {
      const k = eventRecs.length;
      return new Map<string, number>(eventRecs.map((id, index) => [id, k - index]));
    }
    return new Map<string, number>(events.map((event) => [event.id, event.attendeeCount]));
  }, [events, eventRecs, feedMode]);

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

      <FeedTabs value={feedMode} onChange={setFeedMode} />
    </>
  );
}
