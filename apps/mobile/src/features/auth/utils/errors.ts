import { isClerkAPIResponseError } from '@clerk/clerk-expo';
import type { ClerkAPIError } from '@clerk/types';

export type LoginErrors = {
  identifier?: string;
  password?: string;
  code?: string;
  global?: string;
};

export type SignUpErrors = {
  username?: string;
  email?: string;
  password?: string;
  code?: string;
  global?: string;
};

const DEFAULT_GLOBAL_AUTH_ERROR = 'Something went wrong. Please try again.';

export function clearAuthErrors<TField extends string>(
  errors: Partial<Record<TField | 'global', string>> | null,
  fields: (TField | 'global')[]
): Partial<Record<TField | 'global', string>> | null {
  if (!errors) return null;
  const next = { ...errors };
  for (const field of fields) delete next[field];
  return Object.values(next).some(Boolean) ? next : null;
}

function getErrorMessage(error: ClerkAPIError): string {
  return error.longMessage || error.message || DEFAULT_GLOBAL_AUTH_ERROR;
}

export function buildClerkErrorState<TField extends string>({
  error,
  paramMap,
  noParamFallback = 'global',
}: {
  error: unknown;
  paramMap: Partial<Record<string, TField | 'global'>>;
  noParamFallback?: TField | 'global';
}): Partial<Record<TField | 'global', string>> {
  if (!isClerkAPIResponseError(error)) {
    const message =
      error instanceof Error && error.message ? error.message : DEFAULT_GLOBAL_AUTH_ERROR;
    return { global: message } as Partial<Record<TField | 'global', string>>;
  }

  const nextErrors: Partial<Record<TField | 'global', string>> = {};

  for (const apiError of (error.errors ?? []) as ClerkAPIError[]) {
    const paramName = (apiError.meta as { paramName?: string } | undefined)?.paramName;
    const field = (paramName ? paramMap[paramName] : undefined) ?? noParamFallback;
    const message = getErrorMessage(apiError);

    if (field === 'global') {
      nextErrors.global ??= message;
    } else {
      nextErrors[field] = message;
    }
  }

  if (!Object.keys(nextErrors).length) {
    nextErrors.global = DEFAULT_GLOBAL_AUTH_ERROR;
  }

  return nextErrors;
}
