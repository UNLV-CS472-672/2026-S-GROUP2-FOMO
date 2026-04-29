/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as data_ml_eventRec from "../data_ml/eventRec.js";
import type * as data_ml_friendRecs from "../data_ml/friendRecs.js";
import type * as data_ml_friends from "../data_ml/friends.js";
import type * as data_ml_universal from "../data_ml/universal.js";
import type * as data_ml_users from "../data_ml/users.js";
import type * as eventSeedsStatic from "../eventSeedsStatic.js";
import type * as events_attendance from "../events/attendance.js";
import type * as events_ingest from "../events/ingest.js";
import type * as events_mutations from "../events/mutations.js";
import type * as events_queries from "../events/queries.js";
import type * as files from "../files.js";
import type * as likes from "../likes.js";
import type * as posts from "../posts.js";
import type * as seed from "../seed.js";
import type * as tags from "../tags.js";
import type * as temp_seed from "../temp_seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  comments: typeof comments;
  "data_ml/eventRec": typeof data_ml_eventRec;
  "data_ml/friendRecs": typeof data_ml_friendRecs;
  "data_ml/friends": typeof data_ml_friends;
  "data_ml/universal": typeof data_ml_universal;
  "data_ml/users": typeof data_ml_users;
  eventSeedsStatic: typeof eventSeedsStatic;
  "events/attendance": typeof events_attendance;
  "events/ingest": typeof events_ingest;
  "events/mutations": typeof events_mutations;
  "events/queries": typeof events_queries;
  files: typeof files;
  likes: typeof likes;
  posts: typeof posts;
  seed: typeof seed;
  tags: typeof tags;
  temp_seed: typeof temp_seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
