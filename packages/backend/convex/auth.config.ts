import { env } from '@fomo/env/backend';
import type { AuthConfig } from 'convex/server';

export default {
  providers: [
    {
      domain: env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig;
