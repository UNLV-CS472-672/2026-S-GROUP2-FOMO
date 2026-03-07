# 2026-S-GROUP2-FOMO

A centralized hub for local events that would increase community engagement, attendance, and convenience

## 📦 Repo Structure

This monorepo contains:

| Package         | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| `@fomo/backend` | Convex functions + DB schemas                                   |
| `@fomo/web`     | Next.js web app                                                 |
| `@fomo/mobile`  | Expo mobile app                                                 |
| `@fomo/env`     | Typed environment config used by backend + web (+ mobile later) |

## ⚙️ Setup & Development

View Instructions

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

This repo uses **t3-env** to validate env vars through the shared `@fomo/env` package (`packages/env`). Example files:

| Location                        | Purpose                                 |
| ------------------------------- | --------------------------------------- |
| `apps/web/.env.example`         | Web – Next.js + Clerk + Convex          |
| `packages/backend/.env.example` | Backend – Convex auth (Clerk JWT)       |
| `apps/mobile/.env.example`      | Mobile – Expo + Clerk + Convex + Mapbox |

**Copy the relevant `.env.example` to `.env.local`** in each app directory and fill in values.

### Variable reference

| Variable                            | App     | Required | Description                                                                             |
| ----------------------------------- | ------- | -------- | --------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL`            | Web     | Yes      | Convex HTTP endpoint (local: `http://127.0.0.1:3210`)                                   |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web     | Yes      | Clerk publishable key (from [Clerk Dashboard](https://dashboard.clerk.com) → API Keys)  |
| `CLERK_SECRET_KEY`                  | Web     | Yes      | Clerk secret key (server-side)                                                          |
| `CLERK_JWT_ISSUER_DOMAIN`           | Backend | Yes      | Clerk JWT issuer domain (e.g. `https://your-app.clerk.accounts.dev`)                    |
| `EXPO_PUBLIC_CONVEX_URL`            | Mobile  | Yes      | Convex URL (Android emulator: `http://10.0.2.2:3210`, iOS sim: `http://127.0.0.1:3210`) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Mobile  | Yes      | Clerk publishable key                                                                   |
| `EXPO_PUBLIC_MAPBOX_TOKEN`          | Mobile  | Yes      | Mapbox access token (from [Mapbox](https://account.mapbox.com) → Access tokens)         |

If a required var is missing or invalid, the app will throw at startup instead of failing silently at runtime.
