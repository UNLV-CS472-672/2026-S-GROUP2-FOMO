import { internal } from './_generated/api.js';
import { migrations } from './migrations.js';

export const runSetDefaultUpdatedAt = migrations.runner(internal.migrations.setDefaultUpdatedAt);
export const runSetDefaultLastPostAt = migrations.runner(internal.migrations.setDefaultLastPostAt);
export const runSetDefaultLastPostAtExternal = migrations.runner(
  internal.migrations.setDefaultLastPostAtExternal
);
