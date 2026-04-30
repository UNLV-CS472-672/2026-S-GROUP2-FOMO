// Vitest loads Convex modules during import, and `@fomo/env/backend` validates required
// environment variables at module init. This ensures tests can run without CI secrets.

process.env.CLERK_WEBHOOK_SECRET ??= 'whsec_test_dummy';
process.env.CLERK_JWT_ISSUER_DOMAIN ??= 'https://clerk.test';
process.env.TICKETMASTER_API_KEY ??= 'ticketmaster-test-key';
