import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Clock, MapPin, SearchIcon, Sparkles } from 'lucide-react';
import { useState } from 'react';

const RECENT_ITEMS = [
  { icon: Clock, name: 'Thomas & Mack Center', detail: 'South Maryland Parkway, Las Vegas, NV' },
  { icon: Clock, name: 'Fremont Street Experience', detail: 'Fremont Street, Las Vegas, NV' },
  { icon: Clock, name: 'Las Vegas Convention Center', detail: 'Paradise Road, Las Vegas, NV' },
];

const SUGGESTED_ITEMS = [
  { icon: Sparkles, name: 'Events near you', detail: 'Based on your location' },
  { icon: MapPin, name: 'Popular this week', detail: 'Trending in Las Vegas' },
];

export function MapSearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

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
            placeholder="Search events..."
            className="h-10 rounded-xl pl-9 pr-3"
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-105 p-0 overflow-hidden rounded-2xl"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-80 overflow-y-auto py-1">
          {SUGGESTED_ITEMS.map((item) => (
            <button
              key={item.name}
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              onClick={() => setOpen(false)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </button>
          ))}

          <div className="mx-3 my-1 border-t" />

          <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">Recent</p>
          {RECENT_ITEMS.map((item) => (
            <button
              key={item.name}
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              onClick={() => setOpen(false)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
