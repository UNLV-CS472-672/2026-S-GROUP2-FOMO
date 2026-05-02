import type { HttpRouter } from 'convex/server';
import { internal } from '../_generated/api';
import { Id, TableNames } from '../_generated/dataModel';
import { httpAction } from '../_generated/server';

function validateSecret(req: Request): Response | null {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  return null;
}

export function registerDataMlRoutes(http: HttpRouter) {
  http.route({
    path: '/data-ml/get-by-event-ids',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const eventIds = searchParams.getAll('eventId') as unknown as Id<'events'>[];

      const result = await ctx.runQuery(internal.data_ml.eventRec.getByEventIds, { eventIds });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/upsert-user-tag-weights-batch',
    method: 'POST',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const body = await req.json();
      await ctx.runMutation(internal.data_ml.eventRec.upsertUserTagWeightsBatch, body);
      return new Response('OK', { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-user-tag-weights',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const userIds = searchParams.getAll('userId') as unknown as Id<'users'>[];

      const result = await ctx.runQuery(internal.data_ml.eventRec.getUserTagWeights, {
        userIDs: userIds,
      });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-user-tag-weights-timestamps',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const userIds = searchParams.getAll('userId') as unknown as Id<'users'>[];
      const numTags = Number(searchParams.get('numTags'));

      const result = await ctx.runQuery(internal.data_ml.eventRec.getUserTagWeightsWithTimestamps, {
        userIds,
        numTags,
      });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-interactions-by-users',
    method: 'POST',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const body = await req.json();
      const result = await ctx.runMutation(internal.data_ml.eventRec.getInteractionsByUsers, body);
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-interactions-by-user-ids',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const userIds = searchParams.getAll('userId') as unknown as Id<'users'>[];

      const result = await ctx.runQuery(internal.data_ml.eventRec.getInteractionsByUserIds, {
        userIds,
      });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/upsert-event-recs-batch',
    method: 'POST',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const body = await req.json();
      await ctx.runMutation(internal.data_ml.eventRec.upsertEventRecsBatch, body);
      return new Response('OK', { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/upsert-friend-recs',
    method: 'POST',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const body = await req.json();
      await ctx.runMutation(internal.data_ml.friendRecs.upsert, body);
      return new Response('OK', { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/friend-exists',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const userAId = searchParams.get('userAId') as unknown as Id<'users'>;
      const userBId = searchParams.get('userBId') as unknown as Id<'users'>;

      const result = await ctx.runQuery(internal.data_ml.friends.friendExists, {
        userAId,
        userBId,
      });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-friend-ids',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId') as unknown as Id<'users'>;

      const result = await ctx.runQuery(internal.data_ml.friends.getFriendIds, { userId });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/query-all',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const table_name = searchParams.get('table_name') as unknown as TableNames;

      const result = await ctx.runQuery(internal.data_ml.universal.queryAll, { table_name });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/user-exists',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId') as unknown as Id<'users'>;

      const result = await ctx.runQuery(internal.data_ml.users.userExists, { userId });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-all-user-ids',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const result = await ctx.runQuery(internal.data_ml.users.getAllUserIds, {});
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-name-by-id',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId') as unknown as Id<'users'>;

      const result = await ctx.runQuery(internal.data_ml.users.getNameById, { userId });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-preferred-tags-by-user-id',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const userIds = searchParams.getAll('userId') as unknown as Id<'users'>[];

      const result = await ctx.runQuery(internal.data_ml.eventRec.getPreferredTagsByUserId, {
        userIds,
      });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-users-with-recent-activity',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const { searchParams } = new URL(req.url);
      const numTagsRaw = searchParams.get('numTags');
      const numTags = numTagsRaw !== null ? Number(numTagsRaw) : undefined;

      const result = await ctx.runMutation(internal.data_ml.eventRec.getUsersWithRecentActivity, {
        numTags,
      });
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });

  http.route({
    path: '/data-ml/get-all-events-after-now',
    method: 'GET',
    handler: httpAction(async (ctx, req) => {
      const authError = validateSecret(req);
      if (authError) return authError;

      const result = await ctx.runQuery(internal.data_ml.eventRec.getAllEventsAfterNow);
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  });
}
