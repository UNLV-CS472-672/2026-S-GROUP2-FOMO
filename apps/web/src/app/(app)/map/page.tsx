'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { MapSearchOverlay } from '@/features/map/components/map-search-overlay';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { activityToGeoJSON, coordsToH3Cell } from '@/features/map/utils/h3';
import {
  FALLBACK_COORDS,
  loadMapboxAssets,
  type MapboxGlobal,
  type MapboxMap,
  type MapboxMarker,
} from '@/features/map/utils/load-mapbox-assets';
import { eventSeedAttendees, eventSeeds } from '@fomo/backend/convex/seed';
import { env } from '@fomo/env/web';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MAPBOX_TOKEN = env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

// Aggregate seed events into H3 cells with attendee counts
function buildSeedActivity(): { h3Index: string; count: number }[] {
  const map = new Map<string, number>();
  eventSeeds.forEach((event, i) => {
    const h3Index = coordsToH3Cell(event.longitude, event.latitude);
    map.set(h3Index, (map.get(h3Index) ?? 0) + (eventSeedAttendees[i] ?? 1));
  });
  return Array.from(map.entries()).map(([h3Index, count]) => ({ h3Index, count }));
}

const SEED_ACTIVITY = buildSeedActivity();

const H3_FILL_SOURCE = 'h3-activity-source';
const H3_FILL_LAYER = 'h3-activity-fill';
const H3_OUTLINE_LAYER = 'h3-activity-outline';
const H3_CLICK_SOURCE = 'h3-click-source';
const H3_CLICK_LAYER = 'h3-click-layer';

export default function MapPage() {
  const { open, isMobile } = useSidebar();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const mapboxRef = useRef<MapboxGlobal | null>(null);
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [clickedCell, setClickedCell] = useState<string | null>(null);

  const staticMapSrc = useMemo(() => {
    if (!MAPBOX_TOKEN) {
      return '';
    }

    const [lng, lat] = centerCoordinate;
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${lng},${lat},13,0/1400x900?access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
  }, [centerCoordinate]);

  const addH3Layers = useCallback((map: MapboxMap) => {
    const activityGeoJSON = activityToGeoJSON(SEED_ACTIVITY);
    const maxCount = Math.max(...SEED_ACTIVITY.map((c) => c.count), 1);

    map.addSource(H3_FILL_SOURCE, { type: 'geojson', data: activityGeoJSON });

    map.addLayer({
      id: H3_FILL_LAYER,
      type: 'fill',
      source: H3_FILL_SOURCE,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'count'],
          0,
          'rgba(74,144,217,0.1)',
          Math.round(maxCount / 2),
          'rgba(74,144,217,0.45)',
          maxCount,
          'rgba(74,144,217,0.8)',
        ],
        'fill-opacity': 0.85,
      },
    });

    map.addLayer({
      id: H3_OUTLINE_LAYER,
      type: 'line',
      source: H3_FILL_SOURCE,
      paint: {
        'line-color': 'rgba(74,144,217,0.5)',
        'line-width': 1,
      },
    });

    // Source/layer for the clicked cell highlight
    map.addSource(H3_CLICK_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    map.addLayer({
      id: H3_CLICK_LAYER,
      type: 'line',
      source: H3_CLICK_SOURCE,
      paint: {
        'line-color': '#ffffff',
        'line-width': 2,
      },
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;
    let didLoad = false;

    function handleMapClick(e: Record<string, unknown>) {
      if (cancelled) return;
      const lngLat = e.lngLat as { lng: number; lat: number };
      const h3Index = coordsToH3Cell(lngLat.lng, lngLat.lat);
      setClickedCell(h3Index);

      const source = mapRef.current?.getSource(H3_CLICK_SOURCE);
      if (source) {
        source.setData(activityToGeoJSON([{ h3Index, count: 0 }]));
      }
    }

    async function initMap() {
      if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) {
        return;
      }

      try {
        const mapboxgl = await loadMapboxAssets();
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;
        mapboxRef.current = mapboxgl;

        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: FALLBACK_COORDS,
          zoom: 13,
          attributionControl: false,
        });

        mapRef.current.on('load', () => {
          if (!cancelled && mapRef.current) {
            didLoad = true;
            addH3Layers(mapRef.current);
            setMapReady(true);
            setLoadError(null);
            if (loadTimeout) {
              clearTimeout(loadTimeout);
            }
          }
        });

        mapRef.current.on('click', handleMapClick);

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
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  }, [addH3Layers]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (hasResolvedLocation) {
      mapRef.current.flyTo({
        center: centerCoordinate,
        zoom: 13,
        duration: 1200,
      });
    } else {
      mapRef.current.jumpTo({
        center: centerCoordinate,
        zoom: 13,
      });
    }

    mapRef.current.resize();

    if (!locationGranted || !mapboxRef.current) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const markerElement = document.createElement('div');
    markerElement.className = 'mapbox-location-puck';

    markerRef.current?.remove();
    markerRef.current = new mapboxRef.current.Marker({ element: markerElement }).setLngLat(
      centerCoordinate
    );
    markerRef.current.addTo(mapRef.current);
  }, [centerCoordinate, hasResolvedLocation, locationGranted]);

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
    if (!mapRef.current || isMobile) {
      return;
    }

    const resizeFrames = [0, 120, 240];
    const timers = resizeFrames.map((delay) =>
      window.setTimeout(() => {
        mapRef.current?.resize();
      }, delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [open, isMobile]);

  return (
    <section className="relative h-[calc(100vh-7rem)] min-h-[32rem] overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#05070b]">
      {staticMapSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={staticMapSrc}
          alt="Map"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${mapReady ? 'opacity-0' : 'opacity-100'}`}
        />
      ) : null}

      <div
        ref={mapContainerRef}
        className={`absolute inset-0 transition-opacity duration-300 ${mapReady ? 'opacity-100' : 'opacity-0'}`}
      />

      <MapSearchOverlay isOpen={isSearchOpen} onToggle={() => setIsSearchOpen((open) => !open)} />

      {clickedCell ? (
        <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-white/20 bg-black/70 px-4 py-2 font-mono text-xs text-white backdrop-blur">
          H3: {clickedCell}
        </div>
      ) : null}

      {loadError ? (
        <div className="absolute inset-x-4 bottom-4 z-10 rounded-xl border border-red-400/30 bg-black/70 px-4 py-3 text-sm text-red-100 backdrop-blur">
          {loadError}
        </div>
      ) : null}

      <style jsx>{`
        .mapbox-location-puck {
          position: relative;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          border: 2px solid rgba(255, 255, 255, 0.95);
          background: #4a90d9;
          box-shadow: 0 0 0 10px rgba(74, 144, 217, 0.18);
        }

        .mapbox-location-puck::after {
          content: '';
          position: absolute;
          inset: -16px;
          border-radius: 9999px;
          background: rgba(74, 144, 217, 0.16);
          animation: mapbox-pulse 1.8s ease-out infinite;
        }

        @keyframes mapbox-pulse {
          0% {
            transform: scale(0.5);
            opacity: 0.85;
          }

          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
