'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarClock, CalendarPlus, LoaderCircle, Send } from 'lucide-react';

import { useCreateEventForm } from '../hooks/use-create-event-form';
import { CreateEventField } from './field';
import { LocationField } from './location-field';
import { MediaField } from './media-field';
import { TagsField } from './tags-field';

export function CreateEventForm() {
  const form = useCreateEventForm();

  return (
    <main className="min-h-full bg-surface-muted px-4 py-5 sm:px-6 lg:px-8">
      <form
        onSubmit={form.handleSubmit}
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

        <MediaField
          coverFile={form.coverFile}
          previewUrl={form.coverPreviewUrl}
          error={!form.coverFile && form.errorMessage.includes('cover') ? form.errorMessage : ''}
          onClear={form.clearCover}
          onSelectFile={form.setCoverFile}
        />

        <CreateEventField
          label="Name"
          error={form.errorMessage === 'Event name is required.' ? form.errorMessage : ''}
        >
          <Input
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
            placeholder="What's the event called?"
            className="h-12 rounded-2xl border-muted bg-surface px-4 shadow-md"
            aria-invalid={form.errorMessage === 'Event name is required.'}
          />
        </CreateEventField>

        <CreateEventField
          label="Date and time"
          error={form.errorMessage.includes('end time') ? form.errorMessage : ''}
          icon={<CalendarClock className="size-4" aria-hidden="true" />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="datetime-local"
              value={form.startDate}
              onChange={(event) => form.setStartDate(event.target.value)}
              className="h-12 rounded-2xl border-muted bg-surface px-4 shadow-md"
              aria-label="Start date and time"
            />
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(event) => form.setEndDate(event.target.value)}
              className="h-12 rounded-2xl border-muted bg-surface px-4 shadow-md"
              aria-label="End date and time"
            />
          </div>
        </CreateEventField>

        <LocationField
          selectedLocation={form.selectedLocation}
          isUsingCurrentLocation={form.usingCurrentLocation}
          resolvingPlaceId={form.resolvingPlaceId}
          error={
            form.errorMessage.includes('location') || form.errorMessage.includes('place')
              ? form.errorMessage
              : ''
          }
          onClearLocation={form.clearLocation}
          onSelectCurrentLocation={form.selectCurrentLocation}
          onSelectPlace={(place) => void form.selectPlace(place)}
        />

        <CreateEventField label="Description">
          <textarea
            value={form.description}
            onChange={(event) => form.setDescription(event.target.value)}
            placeholder="What's happening?"
            rows={4}
            className="w-full resize-none rounded-2xl border border-muted bg-surface px-4 py-3 text-[15px] text-foreground shadow-md outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </CreateEventField>

        <TagsField
          allTags={form.allTags}
          selectedTags={form.selectedTags}
          onToggleTag={form.toggleTag}
        />

        {form.errorMessage ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {form.errorMessage}
          </p>
        ) : null}

        <div className="fixed bottom-5 right-5 z-30">
          <Button
            type="submit"
            size="icon-lg"
            disabled={form.submitting}
            className="size-12 rounded-full bg-card text-primary shadow-sm hover:bg-card/90"
            aria-label="Create event"
          >
            {form.submitting ? (
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
