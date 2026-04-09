# @fomo/backend

This package contains Convex functions and backend logic.

## Convex commands

- `pnpm convex:dev` - run local Convex dev server
- `pnpm convex:codegen` - generate Convex types
- `pnpm convex:deploy` - deploy backend to Convex

## Ticketmaster ingestion

The Ticketmaster ingestion action is:

- `eventsIngest:syncTicketmasterLasVegas`

### 1. Set backend env vars

Create `packages/backend/.env.local` from `packages/backend/.env.example` and set:

- `CLERK_JWT_ISSUER_DOMAIN` (required for auth config)
- `TICKETMASTER_API_KEY` (required only for Ticketmaster ingestion)

Then set Convex deployment env vars from `packages/backend` (or in the Convex dashboard UI):

```bash
pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
pnpm exec convex env set TICKETMASTER_API_KEY <your_ticketmaster_api_key>
```

### 2. Start Convex dev

```bash
pnpm dev
```

Keep this running in one terminal.

### 3. Dry run ingestion (no DB writes)

```bash
pnpm exec convex run eventsIngest:syncTicketmasterLasVegas '{"dryRun":true,"eventCount":15}'
```

### 4. Run ingestion (writes to `events`)

```bash
pnpm exec convex run eventsIngest:syncTicketmasterLasVegas '{"dryRun":false,"eventCount":15}'
```

### 5. Verify in dashboard

```bash
pnpm dashboard
```

In Convex dashboard, go to `Data` and inspect `events`.

## Arguments

- `category` is an optional argument to filter events by category (for example `sports`, `concerts`, `music`, `arts`, `film`, `miscellaneous`).
- `dryRun` if true, allows you to see ingested events in JSON format and does not write to the Convex DB.
- `eventCount` specifies the number of unique events to be ingested (deduped by attraction + venue).
- `sort` is an optional argument with format `<date | relevance>,<asc | desc>`, it currently defaults to `relevance,desc`.
