'use client';

import { useSidebar } from '@/components/ui/sidebar';
import {
  createEventMarkerMount,
  getEventMarkerImage,
} from '@/features/map/components/event-marker';
import { createLocationPuckMount } from '@/features/map/components/location-puck';
import {
  MAPBOX_STYLE_DARK,
  MAPBOX_STYLE_LIGHT,
  loadMapboxAssets,
  type Coordinates,
  type MapboxGlobal,
  type MapboxMap,
  type MapboxMarker,
} from '@/features/map/utils/load-mapbox-assets';
import type { FeatureCollection, Point } from 'geojson';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

const DEFAULT_ZOOM = 13;
const HEATMAP_SOURCE = 'activity';
const HEATMAP_LAYER = 'activity-heat';

type MapEvent = {
  id: string;
  name?: string;
  attendeeCount: number;
  location: {
    longitude: number;
    latitude: number;
  };
};

type MountedMarker = {
  marker: MapboxMarker;
  cleanup: () => void;
};

type UseMapboxEventMapArgs = {
  centerCoordinate: Coordinates;
  events: ReadonlyArray<MapEvent>;
  hasResolvedLocation: boolean;
  heatmapGeoJSON: FeatureCollection<Point, { weight: number }>;
  isDark: boolean;
  locationGranted: boolean;
  mapboxToken: string;
  onSelectEvent: (eventId: string) => void;
};

export function useMapboxEventMap({
  centerCoordinate,
  events,
  hasResolvedLocation,
  heatmapGeoJSON,
  isDark,
  locationGranted,
  mapboxToken,
  onSelectEvent,
}: UseMapboxEventMapArgs) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<MapboxGlobal | null>(null);
  const locationMarkerRef = useRef<MountedMarker | null>(null);
  const eventMarkersRef = useRef<MountedMarker[]>([]);
  const { state: sidebarState } = useSidebar();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const handleSelectEvent = useEffectEvent(onSelectEvent);

  const clearLocationMarker = useCallback(() => {
    locationMarkerRef.current?.marker.remove();
    locationMarkerRef.current?.cleanup();
    locationMarkerRef.current = null;
  }, []);

  const clearEventMarkers = useCallback(() => {
    eventMarkersRef.current.forEach(({ marker, cleanup }) => {
      marker.remove();
      cleanup();
    });
    eventMarkersRef.current = [];
  }, []);

  const recenterMap = useCallback(() => {
    if (!mapRef.current || !locationGranted) {
      return;
    }

    mapRef.current.flyTo({ center: centerCoordinate, zoom: DEFAULT_ZOOM, duration: 1200 });
  }, [centerCoordinate, locationGranted]);

  useEffect(() => {
    let cancelled = false;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;
    let didLoad = false;

    async function initMap() {
      if (!mapboxToken || !mapContainerRef.current || mapRef.current || !hasResolvedLocation) {
        return;
      }

      try {
        const mapboxgl = await loadMapboxAssets();
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        mapboxgl.accessToken = mapboxToken;
        mapboxRef.current = mapboxgl;

        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: MAPBOX_STYLE_LIGHT,
          center: centerCoordinate,
          zoom: DEFAULT_ZOOM,
          attributionControl: false,
        });

        mapRef.current.on('load', () => {
          if (!cancelled && mapRef.current) {
            didLoad = true;
            mapRef.current.resize();
            setMapReady(true);
            setLoadError(null);
            if (loadTimeout) {
              clearTimeout(loadTimeout);
            }
          }
        });

        requestAnimationFrame(() => {
          mapRef.current?.resize();
        });

        loadTimeout = setTimeout(() => {
          if (!cancelled && !didLoad) {
            setLoadError('Mapbox GL timed out. Showing static map fallback.');
          }
        }, 5000);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Map failed to load.');
        }
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
      clearLocationMarker();
      clearEventMarkers();
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  }, [centerCoordinate, clearEventMarkers, clearLocationMarker, hasResolvedLocation, mapboxToken]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    const map = mapRef.current;

    function applyHeatmap() {
      const source = map.getSource(HEATMAP_SOURCE);
      if (source) {
        source.setData(heatmapGeoJSON);
        return;
      }

      map.addSource(HEATMAP_SOURCE, { type: 'geojson', data: heatmapGeoJSON });
      map.addLayer({
        id: HEATMAP_LAYER,
        type: 'heatmap',
        source: HEATMAP_SOURCE,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 6, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 3],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.2,
            'rgba(245,158,11,0.3)',
            0.5,
            'rgba(245,158,11,0.6)',
            0.8,
            'rgba(245,158,11,0.85)',
            1,
            'rgba(255,255,255,0.95)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 30, 15, 60],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 0.6],
        },
      });
    }

    applyHeatmap();
    map.on('styledata', applyHeatmap);

    return () => {
      map.off('styledata', applyHeatmap);
    };
  }, [heatmapGeoJSON, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) {
      return;
    }

    clearEventMarkers();

    if (events.length === 0) {
      return;
    }

    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    const weights = events.map((event) => event.attendeeCount);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    events.forEach((event, index) => {
      const weightDelta = maxWeight - minWeight || 1;
      const normalizedWeight = (event.attendeeCount - minWeight) / weightDelta;
      const markerMount = createEventMarkerMount({
        imageSrc: getEventMarkerImage(index),
        name: event.name ?? 'Event',
        size: 44 + normalizedWeight * 44,
      });

      markerMount.element.addEventListener('click', () => {
        handleSelectEvent(event.id);
      });

      const marker = new mapboxgl.Marker({ element: markerMount.element, anchor: 'bottom' })
        .setLngLat([event.location.longitude, event.location.latitude])
        .addTo(map);

      eventMarkersRef.current.push({ marker, cleanup: markerMount.cleanup });
    });

    return () => {
      clearEventMarkers();
    };
  }, [clearEventMarkers, events, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }

    mapRef.current.setStyle(isDark ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT);
  }, [isDark, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    if (hasResolvedLocation) {
      mapRef.current.flyTo({
        center: centerCoordinate,
        zoom: DEFAULT_ZOOM,
        duration: 1200,
      });
    } else {
      mapRef.current.jumpTo({
        center: centerCoordinate,
        zoom: DEFAULT_ZOOM,
      });
    }

    mapRef.current.resize();

    if (!locationGranted || !mapboxRef.current) {
      clearLocationMarker();
      return;
    }

    const markerMount = createLocationPuckMount();

    clearLocationMarker();
    locationMarkerRef.current = {
      marker: new mapboxRef.current.Marker({ element: markerMount.element }).setLngLat(
        centerCoordinate
      ),
      cleanup: markerMount.cleanup,
    };
    locationMarkerRef.current.marker.addTo(mapRef.current);
  }, [centerCoordinate, clearLocationMarker, hasResolvedLocation, locationGranted, mapReady]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || !mapRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const delays = [0, 50, 100, 200, 300];
    const timers = delays.map((delay) =>
      window.setTimeout(() => {
        mapRef.current?.resize();
      }, delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [sidebarState]);

  return {
    loadError,
    mapContainerRef,
    mapReady,
    recenterMap,
  };
}
