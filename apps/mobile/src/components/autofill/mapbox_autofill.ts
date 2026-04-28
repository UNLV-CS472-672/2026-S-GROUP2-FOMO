const SUGGEST_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

export type Coordinates = {
  longitude: number;
  latitude: number;
};

export type GeocodingResult = {
  mapbox_id: string;
  name: string;
  full_address: string;
  coordinates: Coordinates;
};

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

// smaller radius in accordance to user
const BBOX_RADIUS_DEG = 0.45;

type SuggestionRaw = {
  mapbox_id: string;
  name: string;
  full_address: string;
  feature_type: string;
};

export async function retrieveCoordinates(
  mapboxId: string,
  sessionToken: string,
  accessToken: string
): Promise<Coordinates | null> {
  const params = new URLSearchParams({
    access_token: accessToken,
    session_token: sessionToken,
  });

  const res = await fetch(`${RETRIEVE_URL}/${mapboxId}?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords) return null;

  return { longitude: coords[0], latitude: coords[1] };
}

export async function geocode(
  query: string,
  accessToken: string,
  sessionToken: string,
  proximity?: Coordinates
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    access_token: accessToken,
    session_token: sessionToken,
    // POI first, then addresses and places as fallback
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
  if (!res.ok) throw new Error(`geocode failed: ${res.status}`);

  const data = await res.json();

  return (data.suggestions as SuggestionRaw[]).map((s) => ({
    mapbox_id: s.mapbox_id,
    name: s.name,
    full_address: s.full_address ?? s.name,
    coordinates: { longitude: 0, latitude: 0 },
  }));
}
