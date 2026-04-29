import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    CLERK_JWT_ISSUER_DOMAIN: z.string().min(1),
    CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
    TICKETMASTER_API_KEY: z.string().min(1),
  },
  clientPrefix: 'PUBLIC_',
  client: {},
  runtimeEnv: {
    CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY,
  },
});
