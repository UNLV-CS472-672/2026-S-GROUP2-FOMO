import {
  debounce,
  geocode,
  retrieveCoordinates,
  type GeocodingResult,
} from '@/components/autofill/mapbox_autofill';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { env } from '@fomo/env/mobile';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Stable session token per component mount (groups suggest+retrieve calls for billing)
function makeSessionToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useLocationSearch(query: string) {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { centerCoordinate } = useUserLocation();
  const sessionToken = useRef(makeSessionToken());

  const fetchResults = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const proximity = centerCoordinate
        ? { longitude: centerCoordinate[0], latitude: centerCoordinate[1] }
        : undefined;

      try {
        const data = await geocode(
          q,
          env.EXPO_PUBLIC_MAPBOX_TOKEN,
          sessionToken.current,
          proximity
        );
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [centerCoordinate]
  );

  const debouncedFetch = useMemo(
    () => debounce(fetchResults as (...args: unknown[]) => void, 300),
    [fetchResults]
  );

  useEffect(() => {
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  // Resolve coordinates for a suggestion on selection
  const resolveCoordinates = useCallback(async (mapboxId: string) => {
    return retrieveCoordinates(mapboxId, sessionToken.current, env.EXPO_PUBLIC_MAPBOX_TOKEN);
  }, []);

  return { results, isLoading, resolveCoordinates };
}
