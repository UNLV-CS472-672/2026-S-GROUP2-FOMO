import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Doc } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { MapPin, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type MapSearchEvent = Doc<'events'>;

type MapSearchOverlayProps = {
  onSelectEvent?: (event: MapSearchEvent) => void;
};

const resultDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

export function MapSearchOverlay({ onSelectEvent }: MapSearchOverlayProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(normalizedQuery, 250);
  const events = useQuery(
    api.events.search,
    open
      ? {
          query: debouncedQuery,
          limit: 8,
        }
      : 'skip'
  );
  const duplicateEventNames = useMemo(() => {
    const nameCounts = new Map<string, number>();

    for (const event of events ?? []) {
      const nameKey = event.name.trim().toLowerCase();
      nameCounts.set(nameKey, (nameCounts.get(nameKey) ?? 0) + 1);
    }

    return new Set(
      [...nameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name)
    );
  }, [events]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!open) {
                setOpen(true);
              }
            }}
            placeholder="Search events by name"
            className="h-10 rounded-xl pl-9 pr-3"
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[26.25rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl p-0"
        sideOffset={6}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="max-h-80 overflow-y-auto py-1">
          {events === undefined ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Loading events...</p>
          ) : events.length > 0 ? (
            events.map((event) => {
              const showEventId = duplicateEventNames.has(event.name.trim().toLowerCase());

              return (
                <button
                  key={event._id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                  onClick={() => {
                    setQuery(event.name);
                    setOpen(false);
                    onSelectEvent?.(event);
                  }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.organization} - {resultDateFormatter.format(new Date(event.startDate))}
                    </p>
                    {showEventId ? (
                      <p className="truncate text-xs text-muted-foreground/70">
                        Event ID {event._id.slice(-6)}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">No matching events.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
