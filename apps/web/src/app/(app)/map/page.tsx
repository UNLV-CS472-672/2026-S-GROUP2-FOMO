'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { pointsToGeoJSON } from '@/features/map/utils/h3';
import {
  FALLBACK_COORDS,
  MAPBOX_STYLE_DARK,
  MAPBOX_STYLE_LIGHT,
  loadMapboxAssets,
  type MapboxGlobal,
  type MapboxMap,
  type MapboxMarker,
} from '@/features/map/utils/load-mapbox-assets';
import { api } from '@fomo/backend/convex/_generated/api';
import { env } from '@fomo/env/web';
import { useQuery } from 'convex/react';
import { Navigation } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

const MAPBOX_TOKEN = env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const emptySubscribe = () => () => {};

const HEATMAP_SOURCE = 'activity';
const HEATMAP_LAYER = 'activity-heat';

const EVENT_IMAGES = [
  '/rigrig.jpg',
  '/jonah-mog.png',
  '/git-learning-class.png',
  '/rate-my-date.jpg',
];

export default function MapPage() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const eventMarkersRef = useRef<MapboxMarker[]>([]);
  const mapboxRef = useRef<MapboxGlobal | null>(null);
  const { centerCoordinate, hasResolvedLocation, locationGranted } = useUserLocation();
  const { resolvedTheme } = useTheme();
  const { state: sidebarState } = useSidebar();
  const events = useQuery(api.data_ml.events.getEvents) ?? [];
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === 'dark';

  const staticMapSrc = useMemo(() => {
    if (!mounted || !MAPBOX_TOKEN) {
      return '';
    }

    const styleId = isDark ? 'dark-v11' : 'streets-v12';
    const [lng, lat] = centerCoordinate;
    return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${lng},${lat},13,0/1400x900?access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
  }, [centerCoordinate, isDark, mounted]);

  const heatmapGeoJSON = useMemo(
    () =>
      pointsToGeoJSON(
        events.map((e) => ({
          longitude: e.location.longitude,
          latitude: e.location.latitude,
          weight: e.attendeeCount,
        }))
      ),
    [events]
  );

  useEffect(() => {
    let cancelled = false;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;
    let didLoad = false;

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
          style: MAPBOX_STYLE_LIGHT,
          center: FALLBACK_COORDS,
          zoom: 13,
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
      markerRef.current?.remove();
      markerRef.current = null;
      eventMarkersRef.current.forEach((m) => m.remove());
      eventMarkersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    function applyHeatmap() {
      const source = map.getSource(HEATMAP_SOURCE);
      if (source) {
        source.setData(heatmapGeoJSON);
      } else {
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
    }

    applyHeatmap();
    map.on('styledata', applyHeatmap);
    return () => {
      map.off('styledata', applyHeatmap);
    };
  }, [mapReady, heatmapGeoJSON]);

  // event markers sized popularity, based off mobile logic
  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) return;
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;

    // clears event markers when refreshing
    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current = [];

    if (events.length === 0) return;

    const weights = events.map((e) => e.attendeeCount);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    events.forEach((event, i) => {
      const t = (event.attendeeCount - minWeight) / (maxWeight - minWeight || 1);
      const size = 44 + t * 44;
      const stemWidth = size * 0.28;
      const stemHeight = size * 0.22;

      const wrapper = document.createElement('div');
      wrapper.className = 'event-marker-wrapper';
      wrapper.style.cssText = `display:flex;flex-direction:column;align-items:center;cursor:pointer;`;

      const circle = document.createElement('div');
      circle.style.cssText = `
        width:${size}px;
        height:${size}px;
        border-radius:9999px;
        border:2px solid #f59e0b;
        overflow:hidden;
        box-shadow:0 4px 12px rgba(0,0,0,0.35);
      `;

      const img = document.createElement('img');
      img.src = EVENT_IMAGES[i % EVENT_IMAGES.length]!;
      img.alt = event.name ?? 'Event';
      img.style.cssText = `width:100%;height:100%;object-fit:cover;`;
      circle.appendChild(img);

      const stem = document.createElement('div');
      stem.style.cssText = `
        width:0;
        height:0;
        margin-top:-1px;
        border-left:${stemWidth / 2}px solid transparent;
        border-right:${stemWidth / 2}px solid transparent;
        border-top:${stemHeight}px solid #f59e0b;
      `;

      wrapper.appendChild(circle);
      wrapper.appendChild(stem);
      wrapper.addEventListener('click', () => {
        router.push(`/events/${event.id}`);
      });

      const marker = new mapboxgl.Marker({ element: wrapper, anchor: 'bottom' }).setLngLat([
        event.location.longitude,
        event.location.latitude,
      ]);
      marker.addTo(map);
      eventMarkersRef.current.push(marker);
    });

    return () => {
      eventMarkersRef.current.forEach((m) => m.remove());
      eventMarkersRef.current = [];
    };
  }, [mapReady, events, router]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const targetStyle = isDark ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT;
    mapRef.current.setStyle(targetStyle);
  }, [isDark, mapReady]);

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
    if (!mapRef.current) return;

    const delays = [0, 50, 100, 200, 300];
    const timers = delays.map((delay) =>
      window.setTimeout(() => {
        mapRef.current?.resize();
      }, delay)
    );

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [sidebarState]);

  function handleRecenter() {
    if (!mapRef.current || !locationGranted) return;
    mapRef.current.flyTo({ center: centerCoordinate, zoom: 13, duration: 1200 });
  }

  return (
    <>
      <section className="absolute inset-0 h-full w-full overflow-hidden bg-[#05070b]">
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
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${mapReady ? 'opacity-100' : 'opacity-0'}`}
        />

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

      <button
        aria-label="Recenter map on your location"
        disabled={!locationGranted}
        onClick={handleRecenter}
        className="fixed bottom-6 right-5 z-50 flex size-12 items-center justify-center rounded-full bg-card shadow-sm transition-opacity active:opacity-90 active:scale-[0.96] disabled:opacity-55"
      >
        <Navigation size={20} className="text-primary" />
      </button>
    </>
  );
}
