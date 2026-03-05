# 2026-S-GROUP2-FOMO

A centralized hub for local events that would increase community engagement, attendance, and convenience

## 📦 Repo Structure

This monorepo contains:
| Package | Description |
| --------------- | ------------------------------------- |
| `@fomo/backend` | Convex functions + DB schemas |
| `@fomo/web` | Next.js web app |
| `@fomo/mobile` | Expo mobile app |

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

#### Important: development build required (Android/iOS)

This repo’s mobile app runs Expo in **development client** mode. That means:

- `pnpm dev` / `pnpm dev:mobile` may open an emulator/simulator and start the Metro server, but it **does not** create a native **development build**, and it **does not** automatically install the `@fomo/mobile` app onto the device.
- If you press **`a`** (Android) or **`i`** (iOS) and see a “No development build … installed” message, you need to install the development build first.

**First-time (or after clearing the emulator/device):**

```bash
pnpm dev:android
```

On macOS with Xcode for iOS:

```bash
pnpm dev:ios
```

Then **stop** the build command (leave the emulator/simulator open), run:

```bash
pnpm dev
```

and press **`a`** (or **`i`**) to open the installed development build and connect it to the dev server.

### Backend (Convex)

```bash
pnpm dev:backend
```

</details>
