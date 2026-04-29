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
    const event = await validateRequest(request);
    if (!event) {
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

  if (!svixId || !svixTimestamp || !svixSignature || !secret) {
    return null;
  }

  try {
    const webhook = new Webhook(secret);
    return webhook.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch {
    return null;
  }
}

export default http;
