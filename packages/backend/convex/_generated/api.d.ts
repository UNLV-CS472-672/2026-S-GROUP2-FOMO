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
import type * as data_ml_friendRecs from "../data_ml/friendRecs.js";
import type * as data_ml_friends from "../data_ml/friends.js";
import type * as data_ml_universal from "../data_ml/universal.js";
import type * as data_ml_users from "../data_ml/users.js";
import type * as seed from "../seed.js";
import type * as updateUserPreferences from "../updateUserPreferences.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "data_ml/friendRecs": typeof data_ml_friendRecs;
  "data_ml/friends": typeof data_ml_friends;
  "data_ml/universal": typeof data_ml_universal;
  "data_ml/users": typeof data_ml_users;
  seed: typeof seed;
  updateUserPreferences: typeof updateUserPreferences;
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
