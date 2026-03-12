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

Use `pnpm dev` as the default mobile development entry point in this monorepo. It starts the Turbo dev workflow (including mobile) and launches Metro. Additionally

```bash
pnpm dev
```

#### Important: development build required (Android/iOS)

This repo’s mobile app runs Expo in **development client** mode. That means:

- `pnpm dev` / `pnpm dev:mobile` may open an emulator/simulator and start the Metro server, but it **does not** create a native **development build**, and it **does not** automatically install the `@fomo/mobile` app onto the device.
- If you press **`a`** (Android) or **`i`** (iOS) and see a “No development build … installed” message, you need to install the development build first.

Choose **one** platform setup path below (Android **or** iOS).

##### Android setup path

Before building for Android, install:

- Android Studio (with Android SDK + emulator tools)
- Java JDK 17

Find your Android SDK path in Android Studio:

- **Android Studio > Settings > Languages & Frameworks > Android SDK**
- Copy the value shown in **Android SDK Location**

Add the following to your `.bashrc` or `.zshrc` (replace `<YOUR_ANDROID_SDK_PATH>`):

```bash
export ANDROID_HOME=<YOUR_ANDROID_SDK_PATH>
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Install the Android development build:

```bash
pnpm dev:android
```

##### iOS setup path (macOS + Xcode)

Install the iOS development build:

```bash
pnpm dev:ios
```

##### After either platform build

Stop the build command (leave the emulator/simulator open), then run:

```bash
pnpm dev
```

Press **`a`** for Android or **`i`** for iOS to open the installed development build and connect it to the dev server.

If you only want mobile + backend (instead of the full monorepo dev workflow), you can use:

```bash
pnpm dev:mobile
```

If you do not need to test the web app at the same time, you can also run `pnpm dev:android` or `pnpm dev:ios` from the repo root to build and launch mobile directly; these workflows also start the Convex backend for you.

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
