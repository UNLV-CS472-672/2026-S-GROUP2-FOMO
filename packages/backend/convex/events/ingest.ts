import { env } from '@fomo/env/backend';
import { v } from 'convex/values';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { action, internalMutation, type MutationCtx } from '../_generated/server';
import { latLngToH3Index } from './queries';

const normalizedEventValidator = v.object({
  name: v.string(),
  organization: v.string(),
  description: v.string(),
  tagNames: v.optional(v.array(v.string())),
  startDate: v.number(),
  endDate: v.number(),
  location: v.object({
    latitude: v.number(),
    longitude: v.number(),
    h3Index: v.string(),
  }),
});

type NormalizedEvent = {
  name: string;
  organization: string;
  description: string;
  tagNames: string[];
  startDate: number;
  endDate: number;
  location: {
    latitude: number;
    longitude: number;
    h3Index: string;
  };
};

type TicketmasterEvent = {
  id?: string;
  name?: string;
  _embedded?: {
    attractions?: Array<{ id?: string }>;
    venues?: Array<{
      name?: string;
      location?: { latitude?: string; longitude?: string };
    }>;
  };
  dates?: {
    start?: { dateTime?: string; localDate?: string };
    end?: { dateTime?: string; localDate?: string };
  };
  classifications?: TicketmasterClassification[];
};

type TicketmasterClassificationValue = {
  name?: string;
};

type TicketmasterClassification = {
  segment?: TicketmasterClassificationValue;
  genre?: TicketmasterClassificationValue;
  subGenre?: TicketmasterClassificationValue;
  type?: TicketmasterClassificationValue;
  subType?: TicketmasterClassificationValue;
};

type TicketmasterAttractionResponse = {
  description?: string;
  info?: string;
  additionalInfo?: string;
  pleaseNote?: string;
};

type TicketmasterEventDetailsResponse = {
  description?: string;
  info?: string;
  additionalInfo?: string;
  pleaseNote?: string;
};

type TicketmasterPageResponse = {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    number?: number;
    size?: number;
    totalPages?: number;
    totalElements?: number;
  };
};

type UpsertNormalizedEventsResult = {
  inserted: number;
  updated: number;
  unchanged: number;
};

type SyncTicketmasterDryRunResult = {
  dryRun: true;
  location: {
    city: string;
    stateCode: string;
    countryCode: string;
  };
  categoryFilter: string | null;
  pagesProcessed: number;
  fetchedCount: number;
  consideredCount: number;
  searchPageSize: number;
  normalizedCount: number;
  targetEventCount: number;
  preview: NormalizedEvent[];
};

type SyncTicketmasterRunResult = {
  dryRun: false;
  location: {
    city: string;
    stateCode: string;
    countryCode: string;
  };
  categoryFilter: string | null;
  pagesProcessed: number;
  fetchedCount: number;
  consideredCount: number;
  searchPageSize: number;
  normalizedCount: number;
  targetEventCount: number;
} & UpsertNormalizedEventsResult;

type SyncTicketmasterResult = SyncTicketmasterDryRunResult | SyncTicketmasterRunResult;

const FALLBACK_EVENT_DESCRIPTION = 'No description available.';

const TICKETMASTER_SEGMENTS = {
  music: 'Music',
  concerts: 'Music',
  concert: 'Music',
  sport: 'Sports',
  sports: 'Sports',
  arts: 'Arts & Theatre',
  theatre: 'Arts & Theatre',
  theater: 'Arts & Theatre',
  film: 'Film',
  movie: 'Film',
  movies: 'Film',
  misc: 'Miscellaneous',
  miscellaneous: 'Miscellaneous',
} as const;

const TICKETMASTER_CATEGORY_TAGS: Record<string, string[]> = {
  music: ['music', 'concert'],
  concert: ['music', 'concert'],
  concerts: ['music', 'concert'],
  'hip-hop/rap': ['music', 'rap', 'concert'],
  rap: ['music', 'rap', 'concert'],
  'r&b': ['music', 'r&b', 'concert'],
  'r&b/urban soul': ['music', 'r&b', 'concert'],
  rock: ['music', 'concert'],
  pop: ['music', 'concert'],
  electronic: ['music', 'concert', 'party'],
  latin: ['music', 'concert', 'culture'],
  jazz: ['music', 'concert'],
  comedy: ['culture'],
  sports: ['games'],
  sport: ['games'],
  basketball: ['games'],
  football: ['games'],
  baseball: ['games'],
  hockey: ['games'],
  'arts & theatre': ['art', 'culture'],
  arts: ['art', 'culture'],
  theatre: ['art', 'culture'],
  theater: ['art', 'culture'],
  'fine art': ['art', 'culture'],
  dance: ['music', 'art', 'culture'],
  family: ['culture'],
  film: ['culture'],
  movie: ['culture'],
  movies: ['culture'],
  miscellaneous: ['culture'],
  misc: ['culture'],
  convention: ['convention', 'vendors'],
  expo: ['convention', 'vendors'],
};

function resolveTicketmasterCategoryFilter(category?: string): string | null {
  const trimmed = category?.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();
  const mapped = TICKETMASTER_SEGMENTS[normalized as keyof typeof TICKETMASTER_SEGMENTS];
  if (mapped) return mapped;

  return trimmed;
}

function normalizeTicketmasterCategory(value?: string): string | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === 'undefined' || normalized === 'n/a') {
    return null;
  }

  return normalized;
}

function tagNamesForTicketmasterEvent(event: TicketmasterEvent): string[] {
  const tagNames = new Set<string>();

  for (const classification of event.classifications ?? []) {
    const categories = [
      classification.segment?.name,
      classification.genre?.name,
      classification.subGenre?.name,
      classification.type?.name,
      classification.subType?.name,
    ];

    for (const category of categories) {
      const mappedTags = TICKETMASTER_CATEGORY_TAGS[normalizeTicketmasterCategory(category) ?? ''];
      for (const tagName of mappedTags ?? []) {
        tagNames.add(tagName);
      }
    }
  }

  return [...tagNames];
}

async function syncExternalEventTags(
  ctx: MutationCtx,
  eventId: Id<'externalEvents'>,
  tagIds: Id<'tags'>[]
): Promise<boolean> {
  const uniqueTagIds = [...new Set(tagIds)];
  const desiredTagIds = new Set(uniqueTagIds.map(String));
  const existingLinks = await ctx.db
    .query('eventTags')
    .withIndex('by_event', (q) => q.eq('eventId', eventId as Id<'events'>))
    .collect();

  let changed = false;
  const linksToDelete = existingLinks.filter((link) => !desiredTagIds.has(String(link.tagId)));
  if (linksToDelete.length > 0) {
    changed = true;
  }

  await Promise.all(linksToDelete.map((link) => ctx.db.delete(link._id)));

  const existingTagIds = new Set(existingLinks.map((link) => String(link.tagId)));
  const tagIdsToInsert = uniqueTagIds.filter((tagId) => !existingTagIds.has(String(tagId)));
  if (tagIdsToInsert.length > 0) {
    changed = true;
  }

  await Promise.all(
    tagIdsToInsert.map((tagId) =>
      ctx.db.insert('eventTags', {
        eventId: eventId as Id<'events'>,
        tagId,
      })
    )
  );

  return changed;
}

function parseTimestamp(dateTime?: string, localDate?: string): number | null {
  if (dateTime) {
    const parsed = Date.parse(dateTime);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (localDate) {
    const parsed = Date.parse(`${localDate}T00:00:00Z`);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function parseCoordinate(value?: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function uniqueEventKey(event: NormalizedEvent): string {
  return `${event.name.trim().toLowerCase()}::${event.organization.trim().toLowerCase()}::${event.startDate}`;
}

function candidateEventKey(event: TicketmasterEvent): string | null {
  const attractionId = event._embedded?.attractions?.[0]?.id?.trim();
  const venue = event._embedded?.venues?.[0]?.name?.trim();
  if (!venue) return null;
  if (attractionId) {
    return `${attractionId.toLowerCase()}::${venue.toLowerCase()}`;
  }

  const name = event.name?.trim();
  if (!name) return null;
  return `${name.toLowerCase()}::${venue.toLowerCase()}`;
}

function pickAttractionAboutText(attraction: TicketmasterAttractionResponse): string | null {
  const candidates = [
    attraction.description,
    attraction.info,
    attraction.additionalInfo,
    attraction.pleaseNote,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return candidates[0] ?? null;
}

async function fetchTicketmasterAttractionAbout(
  apiKey: string,
  attractionId: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ apikey: apiKey });
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/attractions/${attractionId}.json?${params}`
    );
    if (!response.ok) {
      return null;
    }

    const attraction = (await response.json()) as TicketmasterAttractionResponse;
    return pickAttractionAboutText(attraction);
  } catch {
    return null;
  }
}

async function fetchTicketmasterEventAbout(
  apiKey: string,
  eventId: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ apikey: apiKey });
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${eventId}.json?${params}`
    );
    if (!response.ok) {
      return null;
    }

    const eventDetails = (await response.json()) as TicketmasterEventDetailsResponse;
    const candidates = [
      eventDetails.description,
      eventDetails.info,
      eventDetails.additionalInfo,
      eventDetails.pleaseNote,
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    return candidates[0] ?? null;
  } catch {
    return null;
  }
}

function normalizeTicketmasterEvent(
  event: TicketmasterEvent,
  attractionAbout: string | null
): NormalizedEvent | null {
  const startDate = parseTimestamp(event.dates?.start?.dateTime, event.dates?.start?.localDate);
  if (!startDate) return null;

  const parsedEndDate = parseTimestamp(event.dates?.end?.dateTime, event.dates?.end?.localDate);
  const endDate = parsedEndDate ?? startDate + 2 * 60 * 60 * 1000;

  const name = event.name?.trim();
  if (!name) return null;

  const organization = event._embedded?.venues?.[0]?.name?.trim() ?? 'N/A';

  const latitude = parseCoordinate(event._embedded?.venues?.[0]?.location?.latitude);
  const longitude = parseCoordinate(event._embedded?.venues?.[0]?.location?.longitude);
  if (latitude === null || longitude === null) return null;

  const description = attractionAbout?.trim() || FALLBACK_EVENT_DESCRIPTION;

  return {
    name,
    organization,
    description: description.slice(0, 4000),
    tagNames: tagNamesForTicketmasterEvent(event),
    startDate,
    endDate,
    location: {
      latitude,
      longitude,
      h3Index: latLngToH3Index(latitude, longitude),
    },
  };
}

async function fetchTicketmasterEventsPage(
  apiKey: string,
  {
    city,
    stateCode,
    countryCode,
    categoryFilter,
    size,
    page,
    sort,
  }: {
    city: string;
    stateCode: string;
    countryCode: string;
    categoryFilter?: string | null;
    size: number;
    page: number;
    sort: string;
  }
): Promise<TicketmasterPageResponse> {
  const params = new URLSearchParams({
    apikey: apiKey,
    city,
    stateCode,
    countryCode,
    includeTBD: 'no',
    includeTest: 'no',
    size: String(size),
    page: String(page),
    sort,
  });
  if (categoryFilter) {
    params.set('segmentName', categoryFilter);
  }

  const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ticketmaster API request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as TicketmasterPageResponse;
}

export const upsertNormalizedEvents = internalMutation({
  args: {
    events: v.array(normalizedEventValidator),
  },
  handler: async (ctx, { events }) => {
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const event of events) {
      const externalKey = uniqueEventKey(event);
      const existing = await ctx.db
        .query('externalEvents')
        .withIndex('by_externalKey', (q) => q.eq('externalKey', externalKey))
        .unique();

      const tagIds = (
        await Promise.all(
          (event.tagNames ?? []).map(async (tagName) => {
            const tag = await ctx.db
              .query('tags')
              .withIndex('by_name', (q) => q.eq('name', tagName))
              .unique();
            return tag?._id ?? null;
          })
        )
      ).filter((tagId): tagId is Id<'tags'> => tagId !== null);

      if (!existing) {
        const eventId = await ctx.db.insert('externalEvents', {
          externalKey,
          name: event.name,
          organization: event.organization,
          caption: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
        });
        await syncExternalEventTags(ctx, eventId, tagIds);
        inserted += 1;
        continue;
      }

      if (
        existing.organization !== event.organization ||
        existing.caption !== event.description ||
        existing.endDate !== event.endDate ||
        existing.location?.latitude !== event.location.latitude ||
        existing.location?.longitude !== event.location.longitude ||
        existing.location?.h3Index !== event.location.h3Index
      ) {
        await ctx.db.patch(existing._id, {
          externalKey,
          name: event.name,
          organization: event.organization,
          caption: event.description,
          endDate: event.endDate,
          location: event.location,
        });
        await syncExternalEventTags(ctx, existing._id, tagIds);
        updated += 1;
      } else {
        const tagsChanged = await syncExternalEventTags(ctx, existing._id, tagIds);
        if (tagsChanged) {
          updated += 1;
        } else {
          unchanged += 1;
        }
      }
    }

    return { inserted, updated, unchanged };
  },
});

export const syncTicketmasterLasVegas = action({
  args: {
    eventCount: v.optional(v.number()),
    sort: v.optional(v.string()),
    dryRun: v.optional(v.boolean()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SyncTicketmasterResult> => {
    const apiKey = env.TICKETMASTER_API_KEY;

    const city = 'Las Vegas';
    const stateCode = 'NV';
    const countryCode = 'US';
    const sort = args.sort ?? 'relevance,desc';
    const targetEventCount = Math.max(1, Math.floor(args.eventCount ?? 100));
    const dryRun = args.dryRun ?? false;
    const categoryFilter = resolveTicketmasterCategoryFilter(args.category);
    const searchPageSize = 100;

    const normalizedEvents: NormalizedEvent[] = [];
    const seenNormalizedEventKeys = new Set<string>();
    const seenCandidateEventKeys = new Set<string>();
    let fetchedCount = 0;
    let consideredCount = 0;
    const eventAboutCache = new Map<string, string | null>();
    const attractionAboutCache = new Map<string, string | null>();

    let currentPage = 0;
    let totalPages: number | null = null;
    let pagesProcessed = 0;

    while (
      normalizedEvents.length < targetEventCount &&
      (totalPages === null || currentPage < totalPages)
    ) {
      const pageResponse = await fetchTicketmasterEventsPage(apiKey, {
        city,
        stateCode,
        countryCode,
        categoryFilter,
        size: searchPageSize,
        page: currentPage,
        sort,
      });

      const eventsOnPage = pageResponse._embedded?.events ?? [];
      fetchedCount += eventsOnPage.length;

      for (const event of eventsOnPage) {
        if (normalizedEvents.length >= targetEventCount) {
          break;
        }

        const candidateKey = candidateEventKey(event);
        if (candidateKey && seenCandidateEventKeys.has(candidateKey)) {
          continue;
        }
        if (candidateKey) {
          seenCandidateEventKeys.add(candidateKey);
        }

        consideredCount += 1;

        let aboutText: string | null = null;

        if (event.id) {
          if (!eventAboutCache.has(event.id)) {
            const about = await fetchTicketmasterEventAbout(apiKey, event.id);
            eventAboutCache.set(event.id, about);
          }
          aboutText = eventAboutCache.get(event.id) ?? null;
        }

        const attractionIds =
          event._embedded?.attractions
            ?.map((attraction) => attraction.id)
            .filter((id): id is string => Boolean(id)) ?? [];

        if (!aboutText) {
          for (const attractionId of attractionIds) {
            if (!attractionAboutCache.has(attractionId)) {
              const about = await fetchTicketmasterAttractionAbout(apiKey, attractionId);
              attractionAboutCache.set(attractionId, about);
            }

            const cachedAbout = attractionAboutCache.get(attractionId) ?? null;
            if (cachedAbout) {
              aboutText = cachedAbout;
              break;
            }
          }
        }

        const normalized = normalizeTicketmasterEvent(event, aboutText);
        if (normalized) {
          const dedupeKey = uniqueEventKey(normalized);
          if (seenNormalizedEventKeys.has(dedupeKey)) {
            continue;
          }
          seenNormalizedEventKeys.add(dedupeKey);
          normalizedEvents.push(normalized);
          if (normalizedEvents.length >= targetEventCount) {
            break;
          }
        }
      }

      totalPages = pageResponse.page?.totalPages ?? totalPages;
      pagesProcessed += 1;
      currentPage += 1;

      if (eventsOnPage.length === 0) {
        break;
      }
    }

    if (dryRun) {
      const previewEvents = normalizedEvents.slice(0, targetEventCount);
      return {
        dryRun: true,
        location: { city, stateCode, countryCode },
        categoryFilter,
        pagesProcessed,
        fetchedCount,
        consideredCount,
        searchPageSize,
        normalizedCount: previewEvents.length,
        targetEventCount,
        preview: previewEvents,
      };
    }

    const result: UpsertNormalizedEventsResult = await ctx.runMutation(
      internal.events.ingest.upsertNormalizedEvents,
      {
        events: normalizedEvents.slice(0, targetEventCount),
      }
    );

    return {
      dryRun: false,
      location: { city, stateCode, countryCode },
      categoryFilter,
      pagesProcessed,
      fetchedCount,
      consideredCount,
      searchPageSize,
      normalizedCount: Math.min(normalizedEvents.length, targetEventCount),
      targetEventCount,
      ...result,
    };
  },
});
