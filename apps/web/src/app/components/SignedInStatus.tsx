import type { UserIdentity } from 'convex/server';

function formatName(name: string | null | undefined): string {
  return (name ?? 'there')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function SignedInStatus({ identity }: { identity: UserIdentity | null | undefined }) {
  if (identity === undefined) {
    return (
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">Loading...</p>
    );
  }

  if (identity === null) {
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Welcome to FOMO
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Sign in with the button in the top right to access your account.
        </p>
      </>
    );
  }

  const displayName = formatName(identity.name ?? identity.email ?? undefined);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Welcome, {displayName}
      </h1>
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        You&apos;re signed in.
      </p>
    </>
  );
}
