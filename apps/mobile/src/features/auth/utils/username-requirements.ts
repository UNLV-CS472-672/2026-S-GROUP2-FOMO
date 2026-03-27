import type { SignUpResource } from '@clerk/shared/types';

type SignUpMeta = {
  status?: string | null;
  _status?: string | null;
  createdSessionId?: string | null;
  missingFields?: readonly string[] | null;
};

export function getClerkStatus(
  value: { status?: string | null; _status?: string | null } | undefined
) {
  return value?.status ?? value?._status ?? null;
}

export function isMissingRequirements(signUp: SignUpMeta | undefined) {
  return getClerkStatus(signUp) === 'missing_requirements';
}

export function isUsernameMissing(
  signUp: SignUpResource | undefined,
  meta: SignUpMeta | undefined
) {
  return (
    !!signUp &&
    isMissingRequirements(meta) &&
    Array.isArray(meta?.missingFields) &&
    meta.missingFields.includes('username')
  );
}

export function buildMissingRequirementsMessage(
  missingFields: readonly string[] | null | undefined
) {
  if (!Array.isArray(missingFields) || missingFields.length === 0) {
    return 'Sign up could not finish because more account details are still required.';
  }

  return `Sign up could not finish because Clerk still needs: ${missingFields.join(', ')}.`;
}

export function buildIncompleteSignUpMessage(status: string | null | undefined) {
  return `Unable to finish creating your account. Clerk returned status "${status ?? 'unknown'}".`;
}
