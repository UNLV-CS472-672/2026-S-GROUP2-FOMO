'use client';

import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useLocationSearch } from '@/features/map/hooks/use-location-search';
import { Loader2, MapPin, SearchIcon } from 'lucide-react';
import { useState } from 'react';

type MapSearchOverlayProps = {
  onSelectLocation?: (coords: { longitude: number; latitude: number }) => void;
};

export function MapSearchOverlay({ onSelectLocation }: MapSearchOverlayProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, isLoading, resolveCoordinates } = useLocationSearch(query);

  const showResults = query.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            placeholder="Search places or events..."
            className="h-10 rounded-xl pl-9 pr-3"
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-105 overflow-hidden rounded-2xl p-0"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-80 overflow-y-auto py-1">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          )}

          {showResults && !isLoading && results.length === 0 && (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">No places found.</p>
          )}

          {showResults &&
            results.map((loc) => (
              <button
                key={loc.mapbox_id}
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                onClick={async () => {
                  setQuery(loc.name);
                  setOpen(false);
                  const coords = await resolveCoordinates(loc.mapbox_id);
                  if (coords) onSelectLocation?.(coords);
                }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{loc.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{loc.full_address}</p>
                </div>
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
