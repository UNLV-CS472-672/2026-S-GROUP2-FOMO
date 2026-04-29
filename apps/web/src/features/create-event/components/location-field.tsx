import { Input } from '@/components/ui/input';
import { useLocationSearch, type GeocodingResult } from '@/features/map/hooks/use-location-search';
import { cn } from '@/lib/utils';
import { LoaderCircle, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { SelectedEventLocation } from '../types';
import { CreateEventField } from './field';

type LocationFieldProps = {
  error?: string;
  selectedLocation: SelectedEventLocation | null;
  isUsingCurrentLocation: boolean;
  resolvingPlaceId: string | null;
  onClearLocation: () => void;
  onSelectCurrentLocation: () => void;
  onSelectPlace: (place: GeocodingResult) => void;
};

export function LocationField({
  error,
  selectedLocation,
  isUsingCurrentLocation,
  resolvingPlaceId,
  onClearLocation,
  onSelectCurrentLocation,
  onSelectPlace,
}: LocationFieldProps) {
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { results, isLoading } = useLocationSearch(search);

  const filteredLocations = useMemo(() => {
    if (selectedLocation || !isFocused) return [];
    return results.slice(0, 5);
  }, [isFocused, results, selectedLocation]);

  return (
    <CreateEventField
      label="Location"
      error={error}
      action={
        <button
          type="button"
          onClick={onSelectCurrentLocation}
          disabled={isUsingCurrentLocation}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-60"
        >
          {isUsingCurrentLocation ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="size-4" aria-hidden="true" />
          )}
          Use current location
        </button>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-muted bg-surface shadow-md">
        {selectedLocation ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {selectedLocation.kind === 'current' ? (
                <LocateFixed className="size-5" aria-hidden="true" />
              ) : (
                <MapPin className="size-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-foreground">
                {selectedLocation.label}
              </p>
              {selectedLocation.address ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {selectedLocation.address}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                onClearLocation();
              }}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Remove location"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => window.setTimeout(() => setIsFocused(false), 150)}
              placeholder="Search places..."
              className="h-12 border-0 bg-transparent pl-11 pr-10 shadow-none focus-visible:ring-0"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Clear location search"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}

        {filteredLocations.length > 0 ? (
          <div className="max-h-72 overflow-y-auto border-t border-muted">
            {filteredLocations.map((place, index) => {
              const resolving = resolvingPlaceId === place.mapbox_id;
              return (
                <button
                  key={place.mapbox_id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSearch('');
                    onSelectPlace(place);
                  }}
                  disabled={!!resolvingPlaceId}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/60 disabled:opacity-60',
                    index < filteredLocations.length - 1 && 'border-b border-muted'
                  )}
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {resolving ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <MapPin className="size-5" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-foreground">
                      {place.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {place.full_address}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : !selectedLocation && isFocused && search.trim().length > 0 ? (
          <p className="border-t border-muted px-4 py-3 text-[13px] text-muted-foreground">
            {isLoading ? 'Searching places...' : 'No places found.'}
          </p>
        ) : null}
      </div>
    </CreateEventField>
  );
}
