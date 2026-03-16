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

CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 4. Configure backend environment variables

Create a `.env.local` file inside:

`/packages/backend`

Example:

```env
CONVEX_DEPLOYMENT=anonymous:anonymous-fomo
CONVEX_URL=http://127.0.0.1:3210/
CONVEX_SITE_URL=http://127.0.0.1:3211/
```

These URLs should match the ones used in your web environment.

---

## 5. Start the web app

From the repo root:

```bash
pnpm dev:web
```

When prompted in the backend task, create a new Convex project.

---

## 6. Configure Clerk JWT issuer

Add the following environment variable in your Convex environment:

```env
CLERK_JWT_ISSUER_DOMAIN=<your convex site url>
```

Use the same value as `CONVEX_SITE_URL`.

---

# Tech Stack

- Next.js
- Convex
- Clerk Authentication
- pnpm workspaces
