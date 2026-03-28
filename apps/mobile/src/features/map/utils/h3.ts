// h3-js uses Emscripten internally and calls `new TextDecoder('utf-16le')` at
// module init time. React Native's TextDecoder (Hermes) doesn't support
// utf-16le and throws RangeError. Temporarily hide TextDecoder so Emscripten
// falls back to its manual decoder, then restore it.
const _savedTextDecoder = (global as any).TextDecoder;
(global as any).TextDecoder = undefined;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { latLngToCell, cellToBoundary } = require('h3-js') as typeof import('h3-js');
(global as any).TextDecoder = _savedTextDecoder;

import type { FeatureCollection, Point, Polygon } from 'geojson';

// Hexagon resolution size, best utilized for city sizing
export const H3_RESOLUTION = 9;

/**
 * Convert a Mapbox coordinate pair to an H3 cell index.
 *
 * Mapbox uses [longitude, latitude]
 * h3-js latLngToCell uses [latitude, longitude].
 */
export function coordsToH3Cell(longitude: number, latitude: number): string {
  return latLngToCell(latitude, longitude, H3_RESOLUTION);
}

// Convert array of longitude, latitude, weight points to a GeoJSON FeatureCollection for heatmap
export function pointsToGeoJSON(
  points: { longitude: number; latitude: number; weight: number }[]
): FeatureCollection<Point, { weight: number }> {
  return {
    type: 'FeatureCollection',
    features: points.map(({ longitude, latitude, weight }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      properties: { weight },
    })),
  };
}

// Convert array of h3Index and count from events to a GeoJSON, allows for transfer to Mapbox
export function activityToGeoJSON(
  cells: { h3Index: string; count: number }[]
): FeatureCollection<Polygon, { h3Index: string; count: number }> {
  return {
    type: 'FeatureCollection',
    features: cells.map(({ h3Index, count }) => {
      // Switches pair to MapBox requirement
      const boundary = cellToBoundary(h3Index).map(([lat, lng]) => [lng, lat] as [number, number]);
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[...boundary, boundary[0]]],
        },
        properties: { h3Index, count },
      };
    }),
  };
}
