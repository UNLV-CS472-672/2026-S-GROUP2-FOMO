import { api } from '@fomo/backend/convex/_generated/api';
import type { Doc } from '@fomo/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type MapSearchEvent = Doc<'events'>;

type MapSearchOverlayProps = {
  isOpen: boolean;
  onToggle: () => void;
  onSelectEvent?: (event: MapSearchEvent) => void;
};

const H3_INDEX_PATTERN = /^[0-9a-f]{15}$/i;
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

export function MapSearchOverlay({ isOpen, onToggle, onSelectEvent }: MapSearchOverlayProps) {
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const normalizedSearchValue = searchValue.trim();
  const h3Index = H3_INDEX_PATTERN.test(normalizedSearchValue)
    ? normalizedSearchValue.toLowerCase()
    : undefined;
  const debouncedSearchValue = useDebouncedValue(normalizedSearchValue, 250);
  const events = useQuery(
    api.events.search,
    isOpen
      ? {
          query: h3Index ? '' : debouncedSearchValue,
          h3Index,
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    searchInputRef.current?.focus();
  }, [isOpen]);

  return (
    <div className="absolute left-4 right-4 top-3 z-10">
      {isOpen ? (
        <div className="flex w-full items-center gap-3 rounded-lg border border-white/[0.12] bg-[rgba(18,18,18,0.94)] px-4 py-3 shadow-2xl backdrop-blur">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search events</span>
            <input
              ref={searchInputRef}
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  onToggle();
                }
              }}
              placeholder="Search events by name or ID"
              className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
            />
          </label>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-white/55 transition hover:bg-white/[0.08] hover:text-white"
            onClick={onToggle}
          >
            Close
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="w-full rounded-lg border border-white/[0.12] bg-[rgba(18,18,18,0.92)] px-4 py-3 text-left active:bg-[rgba(38,38,38,0.92)]"
          onClick={onToggle}
        >
          <span className="text-[15px] text-white/40">
            {normalizedSearchValue || 'Search events...'}
          </span>
        </button>
      )}

      {isOpen ? (
        <div className="mt-2 rounded-lg border border-white/[0.12] bg-[rgba(18,18,18,0.96)] p-2 shadow-2xl backdrop-blur">
          <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
            {events === undefined ? (
              <p className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white/60">
                Loading events...
              </p>
            ) : events.length > 0 ? (
              events.map((event) => {
                const showEventId = duplicateEventNames.has(event.name.trim().toLowerCase());

                return (
                  <button
                    key={event._id}
                    type="button"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-left transition hover:border-white/25 hover:bg-white/[0.08] focus:border-white/40 focus:outline-none"
                    onClick={() => onSelectEvent?.(event)}
                  >
                    <span className="block text-sm font-semibold text-white">{event.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-white/60">
                      {event.organization} - {resultDateFormatter.format(new Date(event.startDate))}
                    </span>
                    {showEventId ? (
                      <span className="mt-1 block truncate text-[11px] leading-5 text-white/35">
                        Event ID {event._id.slice(-6)}
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <p className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white/60">
                No matching events.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
