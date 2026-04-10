import type { FeatureCollection, Point, Polygon } from 'geojson';
import { cellToBoundary, latLngToCell } from 'h3-js';

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

// Convert array of h3Index and count from events to a GeoJSON FeatureCollection
export function activityToGeoJSON(
  cells: { h3Index: string; count: number }[]
): FeatureCollection<Polygon, { h3Index: string; count: number }> {
  return {
    type: 'FeatureCollection',
    features: cells.map(({ h3Index, count }) => {
      // cellToBoundary returns [lat, lng]; flip to [lng, lat] for Mapbox
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
