import type { CreateMode } from '@/features/create/types';

export function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getModeParam(value: string | string[] | undefined): CreateMode {
  return getStringParam(value) === 'event' ? 'event' : 'post';
}

export function toFileUri(uri: string) {
  if (uri.startsWith('file://')) return uri;
  return `file://${uri}`;
}
