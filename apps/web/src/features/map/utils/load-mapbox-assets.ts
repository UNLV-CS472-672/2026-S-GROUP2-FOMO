export type Coordinates = [number, number];

export const MAPBOX_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';
export const MAPBOX_STYLE_LIGHT = 'mapbox://styles/mapbox/streets-v12';

export type MapboxMap = {
  on: (event: string, handler: () => void) => void;
  flyTo: (options: Record<string, unknown>) => void;
  jumpTo: (options: Record<string, unknown>) => void;
  setStyle: (style: string) => void;
  getStyle: () => { name?: string };
  resize: () => void;
  remove: () => void;
};

export type MapboxMarker = {
  setLngLat: (coords: Coordinates) => MapboxMarker;
  addTo: (map: MapboxMap) => MapboxMarker;
  remove: () => void;
};

export type MapboxGlobal = {
  Map: new (options: Record<string, unknown>) => MapboxMap;
  Marker: new (options: Record<string, unknown>) => MapboxMarker;
  accessToken: string;
};

declare global {
  interface Window {
    mapboxgl?: MapboxGlobal;
  }
}

// Las Vegas coords
export const FALLBACK_COORDS: Coordinates = [-115.1398, 36.1699];

export function loadMapboxAssets() {
  const existingScript = document.querySelector<HTMLScriptElement>('script[data-mapbox-gl]');
  const existingStylesheet = document.querySelector<HTMLLinkElement>('link[data-mapbox-gl]');

  if (!existingStylesheet) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    stylesheet.dataset.mapboxGl = 'true';
    document.head.appendChild(stylesheet);
  }

  if (window.mapboxgl) {
    return Promise.resolve(window.mapboxgl);
  }

  if (existingScript) {
    return new Promise<MapboxGlobal>((resolve, reject) => {
      existingScript.addEventListener('load', () => {
        if (window.mapboxgl) {
          resolve(window.mapboxgl);
          return;
        }

        reject(new Error('Mapbox GL did not initialize.'));
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Mapbox GL script failed to load.'));
      });
    });
  }

  return new Promise<MapboxGlobal>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    script.dataset.mapboxGl = 'true';
    script.onload = () => {
      if (window.mapboxgl) {
        resolve(window.mapboxgl);
        return;
      }

      reject(new Error('Mapbox GL did not initialize.'));
    };
    script.onerror = () => {
      reject(new Error('Mapbox GL script failed to load.'));
    };
    document.body.appendChild(script);
  });
}
