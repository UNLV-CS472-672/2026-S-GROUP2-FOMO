'use client';

import { cn } from '@/lib/utils';

export type FeedMode = 'foryou' | 'popular';

type FeedTabsProps = {
  value: FeedMode;
  onChange: (mode: FeedMode) => void;
};

const TABS: { key: FeedMode; label: string }[] = [
  { key: 'foryou', label: 'For You' },
  { key: 'popular', label: 'Popular' },
];

export function FeedTabs({ value, onChange }: FeedTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Event feed mode"
      className="pointer-events-none absolute inset-x-0 top-4 z-50 flex justify-center"
    >
      <div className="pointer-events-auto flex gap-1 rounded-full bg-card/40 p-1 backdrop-blur">
        {TABS.map((tab) => {
          const isActive = value === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground active:opacity-85'
                  : 'text-foreground hover:bg-accent active:bg-accent'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
