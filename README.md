# 2026-S-GROUP2-FOMO

A centralized hub for local events that would increase community engagement, attendance, and convenience

## 📦 Repo Structure

This monorepo contains:
| Package | Description |
| --------------- | ------------------------------------- |
| `@fomo/backend` | Convex functions + DB schemas |
| `@fomo/web` | Next.js web app |
| `@fomo/mobile` | Expo mobile app |
| `@fomo/env` | Typed environment config used by backend + web (+ mobile later) |

## ⚙️ Setup & Development

<details>

  <summary>View Instructions</summary>

### Installation

```bash
pnpm install
```

## Running locally

### Web

```bash
pnpm dev:web
```

### Mobile

```bash
pnpm dev:mobile
```

### Backend (Convex)

```bash
pnpm dev:backend
```

## 🔐 Environment variables

This repo uses **t3-env** to validate env vars through the shared `@fomo/env` package (`packages/env`):

- **Backend env** – imported from `@fomo/env/backend` and used in Convex (for example in `auth.config.ts`):
  - `NODE_ENV`: `"development" | "test" | "production"`
  - `CLERK_JWT_ISSUER_DOMAIN`: Clerk JWT issuer domain, required.
- **Web env** – imported from `@fomo/env/web` and used in the Next app (for example in the Convex client provider):
  - `NODE_ENV`: `"development" | "test" | "production"`
  - `NEXT_PUBLIC_CONVEX_URL`: URL for the Convex HTTP endpoint, required.
- **Mobile env** – `@fomo/env/mobile` exists but currently has **no app-specific variables**; it’s ready for future `EXPO_PUBLIC_...` keys.

Set these in your local `.env.local` / `.env` files or via deployment-specific env configuration (Convex dashboard, Vercel, EAS, etc.). If a required var is missing or invalid, the app will throw at startup instead of failing silently at runtime.

</details>
