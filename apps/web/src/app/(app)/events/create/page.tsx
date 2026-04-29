'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocationSearch, type GeocodingResult } from '@/features/map/hooks/use-location-search';
import { coordsToH3Cell } from '@/features/map/utils/h3';
import { cn } from '@/lib/utils';
import { Show, SignInButton } from '@clerk/nextjs';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  CalendarClock,
  CalendarPlus,
  Check,
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Search,
  Send,
  Tag,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

const LOCATION_COORDINATE_DECIMALS = 7;

type SelectedLocation = {
  kind: 'current' | 'place';
  label: string;
  address?: string;
  latitude: number;
  longitude: number;
};

function roundGeographicCoordinate(value: number): number {
  const factor = 10 ** LOCATION_COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

function toDatetimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getDefaultStartDate() {
  const date = new Date();
  date.setHours(20, 0, 0, 0);
  return toDatetimeLocalValue(date);
}

function getDefaultEndDate() {
  const date = new Date();
  date.setHours(22, 0, 0, 0);
  return toDatetimeLocalValue(date);
}

export default function CreateEventPage() {
  return (
    <>
      <Show when="signed-in">
        <CreateEventForm />
      </Show>
      <Show when="signed-out">
        <CreateEventSignedOutFallback />
      </Show>
    </>
  );
}

function CreateEventForm() {
  const router = useRouter();
  const queriedTags = useQuery(api.tags.getAllTags);
  const allTags = useMemo(() => queriedTags ?? [], [queriedTags]);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createEvent = useMutation(api.events.mutations.createEvent);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [tagsOpen, setTagsOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationFocused, setLocationFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [resolvingPlaceId, setResolvingPlaceId] = useState<string | null>(null);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { results, isLoading, resolveCoordinates } = useLocationSearch(locationSearch);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl('');
      return;
    }

    const nextUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [coverFile]);

  const filteredTags = useMemo(() => {
    const trimmed = tagSearch.trim().toLowerCase();
    return trimmed ? allTags.filter((tag) => tag.name.toLowerCase().includes(trimmed)) : allTags;
  }, [allTags, tagSearch]);

  const filteredLocations = useMemo(() => {
    if (selectedLocation || !locationFocused) return [];
    return results.slice(0, 5);
  }, [locationFocused, results, selectedLocation]);

  const toggleTag = (tagName: string) => {
    setSelectedTags((current) =>
      current.includes(tagName) ? current.filter((name) => name !== tagName) : [...current, tagName]
    );
  };

  const clearCover = () => {
    setCoverFile(null);
  };

  const clearLocation = () => {
    setLocationSearch('');
    setSelectedLocation(null);
  };

  const selectCurrentLocation = async () => {
    if (usingCurrentLocation) return;
    setUsingCurrentLocation(true);
    setErrorMessage('');

    if (!navigator.geolocation) {
      setErrorMessage('Location is unavailable in this browser.');
      setUsingCurrentLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSelectedLocation({
          kind: 'current',
          label: 'Current location',
          address: 'Uses your current device location',
          latitude: roundGeographicCoordinate(coords.latitude),
          longitude: roundGeographicCoordinate(coords.longitude),
        });
        setLocationFocused(false);
        setLocationSearch('');
        setUsingCurrentLocation(false);
      },
      () => {
        setErrorMessage('Allow location access to use your current location, or choose a place.');
        setUsingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const selectPlace = async (place: GeocodingResult) => {
    if (resolvingPlaceId) return;
    setResolvingPlaceId(place.mapbox_id);
    setErrorMessage('');

    try {
      const coords = await resolveCoordinates(place.mapbox_id);
      if (!coords) {
        setErrorMessage('Could not resolve that place. Try another result.');
        return;
      }

      setSelectedLocation({
        kind: 'place',
        label: place.name,
        address: place.full_address,
        latitude: roundGeographicCoordinate(coords.latitude),
        longitude: roundGeographicCoordinate(coords.longitude),
      });
      setLocationSearch('');
      setLocationFocused(false);
    } finally {
      setResolvingPlaceId(null);
    }
  };

  const uploadCover = async () => {
    if (!coverFile) return undefined;

    const uploadUrl = await generateUploadUrl();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': coverFile.type || 'image/jpeg' },
      body: coverFile,
    });

    if (!uploadResponse.ok) {
      throw new Error('Could not upload the cover image.');
    }

    const { storageId } = (await uploadResponse.json()) as { storageId: Id<'_storage'> };
    return storageId;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setErrorMessage('');

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (!coverFile) {
      setErrorMessage('Add a cover image for the event.');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Event name is required.');
      return;
    }

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      setErrorMessage('Choose an end time after the start time.');
      return;
    }

    if (!selectedLocation) {
      setErrorMessage('Pick a place or use your current location.');
      return;
    }

    setSubmitting(true);
    try {
      const mediaId = await uploadCover();
      const tagIds = selectedTags.flatMap((tagName) => {
        const tag = allTags.find((candidate) => candidate.name === tagName);
        return tag ? [tag.id as Id<'tags'>] : [];
      });

      const latitude = roundGeographicCoordinate(selectedLocation.latitude);
      const longitude = roundGeographicCoordinate(selectedLocation.longitude);
      const eventId = await createEvent({
        name: trimmedName,
        caption: trimmedDescription,
        startDate: startMs,
        endDate: endMs,
        location: {
          latitude,
          longitude,
          h3Index: coordsToH3Cell(longitude, latitude),
        },
        mediaId,
        tagIds,
      });

      router.push('/map');
      router.refresh();
      console.info('Created event', eventId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-full bg-surface-muted px-4 py-5 sm:px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-28 sm:gap-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold tracking-wide text-muted-foreground">CREATE</p>
            <h1 className="mt-1 font-grotesk text-3xl font-semibold tracking-tight text-foreground">
              Event
            </h1>
          </div>
          <CalendarPlus className="size-8 text-primary" aria-hidden="true" />
        </div>

        <Field
          label="Media"
          error={!coverFile && errorMessage.includes('cover') ? errorMessage : ''}
        >
          <div
            className={cn(
              'relative flex aspect-[16/10] min-h-64 overflow-hidden rounded-2xl border bg-surface shadow-md',
              !coverFile && errorMessage.includes('cover') ? 'border-destructive' : 'border-muted'
            )}
          >
            {coverPreviewUrl ? (
              <>
                <Image
                  src={coverPreviewUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 768px, 100vw"
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={clearCover}
                  className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
                  aria-label="Remove image"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center">
                <ImagePlus className="size-8 text-muted-foreground" aria-hidden="true" />
                <span className="text-[15px] font-semibold text-muted-foreground">
                  Add event cover
                </span>
                <span className="text-[13px] leading-5 text-muted-foreground">
                  Choose a photo for the event
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
        </Field>

        <Field label="Name" error={errorMessage === 'Event name is required.' ? errorMessage : ''}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="What's the event called?"
            className="h-12 rounded-2xl border-muted bg-surface px-4 shadow-md"
            aria-invalid={errorMessage === 'Event name is required.'}
          />
        </Field>

        <Field
          label="Date and time"
          error={errorMessage.includes('end time') ? errorMessage : ''}
          icon={<CalendarClock className="size-4" aria-hidden="true" />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-12 rounded-2xl border-muted bg-surface px-4 shadow-md"
              aria-label="Start date and time"
            />
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-12 rounded-2xl border-muted bg-surface px-4 shadow-md"
              aria-label="End date and time"
            />
          </div>
        </Field>

        <Field
          label="Location"
          error={
            errorMessage.includes('location') || errorMessage.includes('place') ? errorMessage : ''
          }
          action={
            <button
              type="button"
              onClick={() => void selectCurrentLocation()}
              disabled={usingCurrentLocation}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-60"
            >
              {usingCurrentLocation ? (
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
                  onClick={clearLocation}
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
                  value={locationSearch}
                  onChange={(event) => setLocationSearch(event.target.value)}
                  onFocus={() => setLocationFocused(true)}
                  onBlur={() => window.setTimeout(() => setLocationFocused(false), 150)}
                  placeholder="Search places..."
                  className="h-12 border-0 bg-transparent pl-11 pr-10 shadow-none focus-visible:ring-0"
                />
                {locationSearch ? (
                  <button
                    type="button"
                    onClick={() => setLocationSearch('')}
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
                      onClick={() => void selectPlace(place)}
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
            ) : !selectedLocation && locationFocused && locationSearch.trim().length > 0 ? (
              <p className="border-t border-muted px-4 py-3 text-[13px] text-muted-foreground">
                {isLoading ? 'Searching places...' : 'No places found.'}
              </p>
            ) : null}
          </div>
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What's happening?"
            rows={4}
            className="w-full resize-none rounded-2xl border border-muted bg-surface px-4 py-3 text-[15px] text-foreground shadow-md outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </Field>

        <Field label="Tags">
          <div className="overflow-hidden rounded-2xl border border-muted bg-surface shadow-md">
            {!tagsOpen ? (
              <button
                type="button"
                onClick={() => setTagsOpen(true)}
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
                  value={tagSearch}
                  onChange={(event) => setTagSearch(event.target.value)}
                  placeholder="Search tags..."
                  autoFocus
                  className="h-12 border-0 bg-transparent pl-11 pr-10 shadow-none focus-visible:ring-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    setTagsOpen(false);
                    setTagSearch('');
                  }}
                  className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Close tags"
                >
                  <ChevronDown className="size-5 rotate-180" aria-hidden="true" />
                </button>
              </div>
            )}

            {tagsOpen ? (
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
                          onClick={() => toggleTag(tag.name)}
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
        </Field>

        {errorMessage ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <div className="fixed bottom-5 right-5 z-30">
          <Button
            type="submit"
            size="icon-lg"
            disabled={submitting}
            className="size-12 rounded-full bg-card text-primary shadow-sm hover:bg-card/90"
            aria-label="Create event"
          >
            {submitting ? (
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  children,
  action,
  error,
  icon,
}: {
  label: string;
  children: ReactNode;
  action?: ReactNode;
  error?: string;
  icon?: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-muted-foreground">
          {icon}
          <span className="uppercase">{label}</span>
        </div>
        {action}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function CreateEventSignedOutFallback() {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        <h1 className="font-grotesk text-2xl font-semibold text-foreground">Create Event</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to publish events and add them to the map.
        </p>
        <SignInButton mode="modal">
          <Button className="mt-5 w-full">Sign in</Button>
        </SignInButton>
      </div>
    </main>
  );
}
