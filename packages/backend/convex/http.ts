import type { WebhookEvent } from '@clerk/backend';
import { env } from '@fomo/env/backend';
import { httpRouter } from 'convex/server';
import { Webhook } from 'svix';

import { internal } from './_generated/api';
import { httpAction } from './_generated/server';

const http = httpRouter();

http.route({
  path: '/clerk-users-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    console.log('[clerk-users-webhook] request received', {
      method: request.method,
      url: request.url,
      hasSvixId: Boolean(request.headers.get('svix-id')),
      hasSvixTimestamp: Boolean(request.headers.get('svix-timestamp')),
      hasSvixSignature: Boolean(request.headers.get('svix-signature')),
    });

    const event = await validateRequest(request);
    if (!event) {
      console.warn('[clerk-users-webhook] request rejected before event handling');
      return new Response('Invalid webhook payload', { status: 400 });
    }

    console.log('[clerk-users-webhook] incoming event', {
      type: event.type,
      userId: event.data?.id ?? null,
      data: event.data,
    });

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
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payload = await req.text();
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  const secret = env.CLERK_WEBHOOK_SECRET;

  console.log('[clerk-users-webhook] validating request', {
    payloadLength: payload.length,
    svixId: svixId ?? null,
    hasSvixTimestamp: Boolean(svixTimestamp),
    hasSvixSignature: Boolean(svixSignature),
    hasWebhookSecret: Boolean(secret),
  });

  if (!svixId || !svixTimestamp || !svixSignature || !secret) {
    console.warn('[clerk-users-webhook] missing required verification inputs');
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
    console.error('[clerk-users-webhook] signature verification failed', error);
    return null;
  }
}

export default http;
export { default } from './data_ml/http';
