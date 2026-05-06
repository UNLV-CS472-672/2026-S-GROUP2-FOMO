type UserIdentity = {
  username?: string | null;
  avatarUrl?: string | null;
  deletedAt?: number | null;
};

export const DELETED_ACCOUNT_DISPLAY_NAME = 'Deleted account';

function hasDeletedAt(user: UserIdentity) {
  return typeof user.deletedAt === 'number';
}

export function isDeletedAccount(user: UserIdentity | null | undefined) {
  if (!user) return false;
  return hasDeletedAt(user);
}

export function getDisplayNameForUser(user: UserIdentity | null | undefined) {
  if (!user) return 'Unknown user';
  if (isDeletedAccount(user)) return DELETED_ACCOUNT_DISPLAY_NAME;
  return user.username || 'Unknown user';
}

export function getUsernameForUser(user: UserIdentity | null | undefined) {
  if (!user || isDeletedAccount(user)) return '';
  return user.username || '';
}

export function getAvatarUrlForUser(user: UserIdentity | null | undefined) {
  if (!user || isDeletedAccount(user)) return '';
  return user.avatarUrl || '';
}
