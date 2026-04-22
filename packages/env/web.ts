import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
    NEXT_PUBLIC_APPSTORE_URL: z.string().url().optional(),
    NEXT_PUBLIC_PLAYSTORE_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_APPSTORE_URL: process.env.NEXT_PUBLIC_APPSTORE_URL,
    NEXT_PUBLIC_PLAYSTORE_URL: process.env.NEXT_PUBLIC_PLAYSTORE_URL,
  },
});
