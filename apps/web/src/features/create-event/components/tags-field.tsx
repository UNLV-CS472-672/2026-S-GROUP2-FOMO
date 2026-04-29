import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Search, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { EventTagOption } from '../types';
import { CreateEventField } from './field';

type TagsFieldProps = {
  allTags: EventTagOption[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
};

export function TagsField({ allTags, selectedTags, onToggleTag }: TagsFieldProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredTags = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    return trimmed ? allTags.filter((tag) => tag.name.toLowerCase().includes(trimmed)) : allTags;
  }, [allTags, search]);

  return (
    <CreateEventField label="Tags">
      <div className="overflow-hidden rounded-2xl border border-muted bg-surface shadow-md">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left"
          >
            <Tag className="size-4 text-muted-foreground" aria-hidden="true" />
            {selectedTags.length > 0 ? (
              <>
                <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
                  {selectedTags.join(', ')}
                </span>
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                  {selectedTags.length}
                </span>
              </>
            ) : (
              <span className="flex-1 text-[15px] text-muted-foreground">Add tags...</span>
            )}
            <ChevronDown className="size-5 text-muted-foreground" aria-hidden="true" />
          </button>
        ) : (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tags..."
              autoFocus
              className="h-12 border-0 bg-transparent pl-11 pr-10 shadow-none focus-visible:ring-0"
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearch('');
              }}
              className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close tags"
            >
              <ChevronDown className="size-5 rotate-180" aria-hidden="true" />
            </button>
          </div>
        )}

        {isOpen ? (
          <div className="border-t border-muted p-3">
            {allTags.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Loading tags...</p>
            ) : filteredTags.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No tags found.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredTags.map((tag) => {
                  const selected = selectedTags.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onToggleTag(tag.name)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-medium transition',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      )}
                    >
                      {selected ? <Check className="size-3" aria-hidden="true" /> : null}
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </CreateEventField>
  );
}
