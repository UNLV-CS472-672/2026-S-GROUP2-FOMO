import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { env } from '@fomo/env/web';
import { useEffect, useMemo, useRef, useState } from 'react';

const SUGGEST_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

export type GeocodingResult = {
  mapbox_id: string;
  name: string;
  full_address: string;
  coordinates: { longitude: number; latitude: number };
};

type SuggestionRaw = {
  mapbox_id: string;
  name: string;
  full_address: string;
  feature_type: string;
};

// smaller radius in accordance to user
const BBOX_RADIUS_DEG = 0.45;

async function suggest(
  query: string,
  accessToken: string,
  sessionToken: string,
  proximity?: { longitude: number; latitude: number }
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    access_token: accessToken,
    session_token: sessionToken,
    types: 'poi,address,place',
    limit: '5',
    language: 'en',
  });

  if (proximity) {
    const { longitude: lng, latitude: lat } = proximity;
    params.set('proximity', `${lng},${lat}`);
    params.set(
      'bbox',
      `${lng - BBOX_RADIUS_DEG},${lat - BBOX_RADIUS_DEG},${lng + BBOX_RADIUS_DEG},${lat + BBOX_RADIUS_DEG}`
    );
  }

  const res = await fetch(`${SUGGEST_URL}?${params}`);
  if (!res.ok) throw new Error(`suggest failed: ${res.status}`);
  const data = await res.json();

  return (data.suggestions as SuggestionRaw[]).map((s) => ({
    mapbox_id: s.mapbox_id,
    name: s.name,
    full_address: s.full_address ?? s.name,
    coordinates: { longitude: 0, latitude: 0 },
  }));
}

export async function retrieveCoordinates(
  mapboxId: string,
  sessionToken: string,
  accessToken: string
): Promise<{ longitude: number; latitude: number } | null> {
  const params = new URLSearchParams({ access_token: accessToken, session_token: sessionToken });
  const res = await fetch(`${RETRIEVE_URL}/${mapboxId}?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords) return null;
  return { longitude: coords[0], latitude: coords[1] };
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

function makeSessionToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useLocationSearch(query: string) {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { centerCoordinate, locationGranted } = useUserLocation();
  const sessionToken = useRef(makeSessionToken());

  const fetchResults = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const proximity = locationGranted
      ? { longitude: centerCoordinate[0], latitude: centerCoordinate[1] }
      : undefined;

    try {
      const data = await suggest(q, env.NEXT_PUBLIC_MAPBOX_TOKEN, sessionToken.current, proximity);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useMemo(
    () => debounce(fetchResults as (...args: unknown[]) => void, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locationGranted, centerCoordinate]
  );

  useEffect(() => {
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  const resolveCoordinates = (mapboxId: string) =>
    retrieveCoordinates(mapboxId, sessionToken.current, env.NEXT_PUBLIC_MAPBOX_TOKEN);

  return { results, isLoading, resolveCoordinates };
}
