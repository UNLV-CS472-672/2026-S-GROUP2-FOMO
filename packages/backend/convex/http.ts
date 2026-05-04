import type { WebhookEvent } from '@clerk/backend';
import { env } from '@fomo/env/backend';
import { httpRouter } from 'convex/server';
import { Webhook } from 'svix';

import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { registerDataMlRoutes } from './data_ml/http';

const http = httpRouter();

registerDataMlRoutes(http);

const clerkWebhookHandler = httpAction(async (ctx, request) => {
  console.log('[clerk-webhook] request received', {
    method: request.method,
    url: request.url,
    hasSvixId: Boolean(request.headers.get('svix-id')),
    hasSvixTimestamp: Boolean(request.headers.get('svix-timestamp')),
    hasSvixSignature: Boolean(request.headers.get('svix-signature')),
  });

  const event = await validateRequest(request);
  if (!event) {
    console.warn('[clerk-webhook] request rejected before event handling');
    return new Response('Invalid webhook payload', { status: 400 });
  }

  switch (event.type) {
    case 'user.created':
    case 'user.updated':
      await ctx.runMutation(internal.users.upsertFromClerk, { data: event.data });
      break;
    case 'user.deleted': {
      const clerkUserId = event.data.id;
      if (!clerkUserId) {
        return new Response('Missing Clerk user id', { status: 400 });
      }
      await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
      break;
    }
    default:
      break;
  }

  return new Response(null, { status: 200 });
});

http.route({ path: '/webhooks/clerk', method: 'POST', handler: clerkWebhookHandler });

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payload = await req.text();
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  const secret = env.CLERK_WEBHOOK_SECRET;

  console.log('[clerk-webhook] validating request', {
    payloadLength: payload.length,
    svixId: svixId ?? null,
    hasSvixTimestamp: Boolean(svixTimestamp),
    hasSvixSignature: Boolean(svixSignature),
    hasWebhookSecret: Boolean(secret),
  });

  if (!svixId || !svixTimestamp || !svixSignature || !secret) {
    console.warn('[clerk-webhook] missing required verification inputs');
    return null;
  }

  try {
    const webhook = new Webhook(secret);
    return webhook.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error('[clerk-webhook] signature verification failed', error);
    return null;
  }
}

export default http;
