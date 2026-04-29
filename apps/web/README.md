# @fomo/web

Frontend web client for the **FOMO** project.\
Built with **Next.js**, **Clerk**, and **Convex**.

---

# Local Setup

Follow these steps to run the web client locally.

---

## 1. Install dependencies

From the repository root:

```bash
pnpm install
```

---

## 2. Log into Convex

```bash
npx convex login
```

Open the link in your browser and sign in to your Convex account.

---

## 3. Configure `/apps/web` environment variables

Create a `.env.local` file inside `/apps/web`.

Use `.env.example` as a reference.

Example:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_MAPBOX_TOKEN=pk.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXX

CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 4. Configure backend deployment environment variables

Set backend environment variables in the Convex deployment environment store,
either in the Convex dashboard UI or via CLI.

From `packages/backend`, run:

```bash
pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
pnpm exec convex env set CLERK_WEBHOOK_SECRET whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
pnpm exec convex env set TICKETMASTER_API_KEY your_ticketmaster_api_key
```

`CLERK_WEBHOOK_SECRET` is required for Clerk webhook signature verification on `/clerk-users-webhook`.
`TICKETMASTER_API_KEY` is only required if you run Ticketmaster ingestion actions.

---

## 5. Start the web app

From the repo root:

```bash
pnpm dev:web
```

When prompted in the backend task, create a new Convex project.

---

## 6. Verify deployment environment variables

You can verify the currently linked deployment environment variables with:

```bash
cd packages/backend
pnpm exec convex env list
```

---

# Tech Stack

- Next.js
- Convex
- Clerk Authentication
- pnpm workspaces
