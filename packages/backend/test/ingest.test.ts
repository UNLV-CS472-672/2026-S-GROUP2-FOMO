import { convexTest } from 'convex-test';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api, internal } from '../convex/_generated/api';
import schema from '../convex/schema';

process.env.CLERK_JWT_ISSUER_DOMAIN ??= 'https://clerk.test';
process.env.TICKETMASTER_API_KEY ??= 'ticketmaster-test-key';

const modules = import.meta.glob('../convex/**/*.ts');

function setup() {
  return convexTest(schema, modules);
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function textResponse(body: string, init?: ResponseInit): Response {
  return new Response(body, init);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('api.eventsIngest', () => {
  describe('upsertNormalizedEvents', () => {
    it('inserts new rows, patches same-name matches, and leaves exact matches unchanged', async () => {
      const t = setup();

      await t.run(async (ctx) => {
        await ctx.db.insert('events', {
          name: 'Exact Match',
          organization: 'Exact Venue',
          description: 'Stable description',
          startDate: 200,
          endDate: 260,
          location: {
            latitude: 36.1,
            longitude: -115.1,
            h3Index: 'exact-h3',
          },
        });

        await ctx.db.insert('events', {
          name: 'Same Name',
          organization: 'Old Venue',
          description: 'Outdated description',
          startDate: 300,
          endDate: 360,
          location: {
            latitude: 36.2,
            longitude: -115.2,
            h3Index: 'old-h3',
          },
        });
      });

      const result = await t.mutation(internal.eventsIngest.upsertNormalizedEvents, {
        events: [
          {
            name: 'Brand New',
            organization: 'New Venue',
            description: 'Fresh description',
            startDate: 100,
            endDate: 160,
            location: {
              latitude: 36.3,
              longitude: -115.3,
              h3Index: 'new-h3',
            },
          },
          {
            name: 'Exact Match',
            organization: 'Exact Venue',
            description: 'Stable description',
            startDate: 200,
            endDate: 260,
            location: {
              latitude: 36.1,
              longitude: -115.1,
              h3Index: 'exact-h3',
            },
          },
          {
            name: 'Same Name',
            organization: 'Updated Venue',
            description: 'Updated description',
            startDate: 300,
            endDate: 390,
            location: {
              latitude: 36.25,
              longitude: -115.25,
              h3Index: 'updated-h3',
            },
          },
        ],
      });

      expect(result).toEqual({
        inserted: 1,
        updated: 1,
        unchanged: 1,
      });

      const events = await t.run(async (ctx) => {
        return await ctx.db.query('events').collect();
      });

      expect(events).toHaveLength(3);
      expect(events.find((event) => event.name === 'Brand New')).toMatchObject({
        organization: 'New Venue',
        description: 'Fresh description',
        startDate: 100,
      });
      expect(events.find((event) => event.name === 'Exact Match')).toMatchObject({
        organization: 'Exact Venue',
        description: 'Stable description',
        endDate: 260,
      });
      expect(events.find((event) => event.name === 'Same Name')).toMatchObject({
        organization: 'Updated Venue',
        description: 'Updated description',
        endDate: 390,
        location: {
          latitude: 36.25,
          longitude: -115.25,
          h3Index: 'updated-h3',
        },
      });
    });
  });

  describe('syncTicketmasterLasVegas', () => {
    it('supports dry runs, category mapping, attraction fallback, and duplicate skipping', async () => {
      const t = setup();

      const fetchMock = vi.fn(async (input: string | URL | Request) => {
        const rawUrl =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const url = new URL(rawUrl);

        if (url.pathname.endsWith('/events.json')) {
          expect(url.searchParams.get('city')).toBe('Las Vegas');
          expect(url.searchParams.get('stateCode')).toBe('NV');
          expect(url.searchParams.get('countryCode')).toBe('US');
          expect(url.searchParams.get('segmentName')).toBe('Music');

          return jsonResponse({
            _embedded: {
              events: [
                {
                  name: 'Alpha',
                  _embedded: {
                    attractions: [{ id: 'attr_shared' }],
                    venues: [
                      {
                        name: 'Venue One',
                        location: { latitude: '36.1147', longitude: '-115.1728' },
                      },
                    ],
                  },
                  dates: {
                    start: { localDate: '2026-05-01' },
                  },
                },
                {
                  id: 'evt_dup_candidate',
                  name: 'Ignored Duplicate Candidate',
                  _embedded: {
                    attractions: [{ id: 'attr_shared' }],
                    venues: [
                      {
                        name: 'Venue One',
                        location: { latitude: '36.1147', longitude: '-115.1728' },
                      },
                    ],
                  },
                  dates: {
                    start: { dateTime: '2026-05-01T04:00:00Z' },
                  },
                },
                {
                  id: 'evt_dup_normalized',
                  name: 'Alpha',
                  _embedded: {
                    attractions: [{ id: 'attr_other' }],
                    venues: [
                      {
                        name: 'Venue One',
                        location: { latitude: '36.1147', longitude: '-115.1728' },
                      },
                    ],
                  },
                  dates: {
                    start: { dateTime: '2026-05-01T08:00:00Z' },
                  },
                },
                {
                  id: 'evt_beta',
                  name: 'Beta',
                  _embedded: {
                    attractions: [{ id: 'attr_beta' }],
                    venues: [
                      {
                        name: 'Venue Two',
                        location: { latitude: '36.1699', longitude: '-115.1398' },
                      },
                    ],
                  },
                  dates: {
                    start: { dateTime: '2026-06-10T18:30:00Z' },
                    end: { dateTime: '2026-06-10T21:15:00Z' },
                  },
                },
              ],
            },
            page: {
              number: 0,
              size: 100,
              totalPages: 1,
              totalElements: 4,
            },
          });
        }

        if (url.pathname.endsWith('/events/evt_dup_candidate.json')) {
          return jsonResponse({
            info: 'This should never be used because the event is skipped first.',
          });
        }

        if (url.pathname.endsWith('/events/evt_dup_normalized.json')) {
          return jsonResponse({});
        }

        if (url.pathname.endsWith('/events/evt_beta.json')) {
          return jsonResponse({ description: 'Beta from event details' });
        }

        if (url.pathname.endsWith('/attractions/attr_shared.json')) {
          return jsonResponse({ pleaseNote: 'Shared attraction description' });
        }

        if (url.pathname.endsWith('/attractions/attr_other.json')) {
          return jsonResponse({ info: 'Other attraction description' });
        }

        if (url.pathname.endsWith('/attractions/attr_beta.json')) {
          return jsonResponse({ additionalInfo: 'This should not be needed.' });
        }

        throw new Error(`Unexpected fetch: ${rawUrl}`);
      });

      vi.stubGlobal('fetch', fetchMock);

      const result = await t.action(api.eventsIngest.syncTicketmasterLasVegas, {
        eventCount: 2,
        dryRun: true,
        category: ' concerts ',
      });

      expect(result).toMatchObject({
        dryRun: true,
        categoryFilter: 'Music',
        pagesProcessed: 1,
        fetchedCount: 4,
        consideredCount: 3,
        normalizedCount: 2,
        targetEventCount: 2,
        searchPageSize: 100,
      });
      expect(result.preview).toHaveLength(2);
      expect(result.preview[0]).toMatchObject({
        name: 'Alpha',
        organization: 'Venue One',
        description: 'Shared attraction description',
        startDate: Date.parse('2026-05-01T00:00:00Z'),
        endDate: Date.parse('2026-05-01T02:00:00Z'),
      });
      expect(result.preview[1]).toMatchObject({
        name: 'Beta',
        organization: 'Venue Two',
        description: 'Beta from event details',
        endDate: Date.parse('2026-06-10T21:15:00Z'),
      });

      const storedEvents = await t.run(async (ctx) => {
        return await ctx.db.query('events').collect();
      });

      expect(storedEvents).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(5);
    });

    it('inserts a fallback description when both event and attraction lookups fail', async () => {
      const t = setup();

      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string | URL | Request) => {
          const rawUrl =
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
          const url = new URL(rawUrl);

          if (url.pathname.endsWith('/events.json')) {
            return jsonResponse({
              _embedded: {
                events: [
                  {
                    id: 'evt_fallback',
                    name: 'Fallback Event',
                    _embedded: {
                      attractions: [{ id: 'attr_fallback' }],
                      venues: [
                        {
                          name: 'Fallback Arena',
                          location: { latitude: '36.1147', longitude: '-115.1728' },
                        },
                      ],
                    },
                    dates: {
                      start: { dateTime: '2026-05-01T20:00:00Z' },
                    },
                  },
                ],
              },
              page: {
                number: 0,
                size: 100,
                totalPages: 1,
                totalElements: 1,
              },
            });
          }

          if (url.pathname.endsWith('/events/evt_fallback.json')) {
            return textResponse('not found', { status: 404 });
          }

          if (url.pathname.endsWith('/attractions/attr_fallback.json')) {
            return textResponse('missing attraction', { status: 404 });
          }

          throw new Error(`Unexpected fetch: ${rawUrl}`);
        })
      );

      const result = await t.action(api.eventsIngest.syncTicketmasterLasVegas, {
        eventCount: 1,
      });

      expect(result).toMatchObject({
        dryRun: false,
        fetchedCount: 1,
        consideredCount: 1,
        normalizedCount: 1,
        inserted: 1,
        updated: 0,
        unchanged: 0,
      });

      const events = await t.run(async (ctx) => {
        return await ctx.db.query('events').collect();
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        name: 'Fallback Event',
        organization: 'Fallback Arena',
        description: 'No description available.',
        startDate: Date.parse('2026-05-01T20:00:00Z'),
        endDate: Date.parse('2026-05-01T22:00:00Z'),
      });
      expect(events[0]?.location.h3Index).toEqual(expect.any(String));
    });

    it('returns an empty dry-run result when the search page has no events', async () => {
      const t = setup();

      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string | URL | Request) => {
          const rawUrl =
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
          const url = new URL(rawUrl);

          if (url.pathname.endsWith('/events.json')) {
            return jsonResponse({
              page: {
                number: 0,
                size: 100,
                totalPages: 3,
                totalElements: 0,
              },
            });
          }

          throw new Error(`Unexpected fetch: ${rawUrl}`);
        })
      );

      const result = await t.action(api.eventsIngest.syncTicketmasterLasVegas, {
        dryRun: true,
        eventCount: 3,
      });

      expect(result).toEqual({
        dryRun: true,
        location: {
          city: 'Las Vegas',
          stateCode: 'NV',
          countryCode: 'US',
        },
        categoryFilter: null,
        pagesProcessed: 1,
        fetchedCount: 0,
        consideredCount: 0,
        searchPageSize: 100,
        normalizedCount: 0,
        targetEventCount: 3,
        preview: [],
      });
    });

    it('throws when the Ticketmaster search request fails', async () => {
      const t = setup();

      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string | URL | Request) => {
          const rawUrl =
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
          const url = new URL(rawUrl);

          if (url.pathname.endsWith('/events.json')) {
            return textResponse('upstream blew up', { status: 500 });
          }

          throw new Error(`Unexpected fetch: ${rawUrl}`);
        })
      );

      await expect(
        t.action(api.eventsIngest.syncTicketmasterLasVegas, {
          eventCount: 1,
          category: 'custom-segment',
        })
      ).rejects.toThrow('Ticketmaster API request failed (500): upstream blew up');
    });
  });
});
