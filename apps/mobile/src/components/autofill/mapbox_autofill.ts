const BASE_URL = 'https://api.mapbox.com/search/geocode/v6/forward';

type Coordinates = {
  longitude: number;
  latitude: number;
};

type GeocodingResult = {
  mapbox_id: string;
  name: string;
  full_address: string;
  coordinates: Coordinates;
};

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

async function geocode(query: string, accessToken: string): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    access_token: accessToken,
    permanent: 'false', // IMPORTANT NOTE!!! Set this to "true" once we deploy.
    autocomplete: 'true',
    limit: '5',
    language: 'en',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`geocode failed: ${res.status}`);

  const data = await res.json();

  return data.features.map(
    (f: {
      properties: {
        mapbox_id: string;
        name: string;
        full_address: string;
        coordinates: { longitude: number; latitude: number };
      };
    }) => ({
      mapbox_id: f.properties.mapbox_id,
      name: f.properties.name,
      full_address: f.properties.full_address,
      coordinates: {
        longitude: f.properties.coordinates.longitude,
        latitude: f.properties.coordinates.latitude,
      },
    })
  );
}
