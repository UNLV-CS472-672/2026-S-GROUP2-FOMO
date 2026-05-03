import { internal } from './_generated/api.js';
import { migrations } from './migrations.js';

export const runSetDefaultUpdatedAt = migrations.runner(internal.migrations.setDefaultUpdatedAt);
