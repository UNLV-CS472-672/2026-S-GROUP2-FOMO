'use client';

import type { RefObject } from 'react';

type MapSurfaceProps = {
  mapContainerRef: RefObject<HTMLDivElement | null>;
  mapReady: boolean;
  loadError: string | null;
  staticMapSrc: string;
};

export function MapSurface({
  mapContainerRef,
  mapReady,
  loadError,
  staticMapSrc,
}: MapSurfaceProps) {
  return (
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
    </section>
  );
}
