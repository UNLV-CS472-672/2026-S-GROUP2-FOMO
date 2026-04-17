'use client';

import { useUser } from '@clerk/nextjs';

function formatName(name: string | null | undefined): string {
  return (name ?? 'there')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function SignedInStatus() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">Loading...</p>
    );
  }

  if (!isSignedIn || !user) {
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

  const displayName = formatName(
    user.fullName ?? user.firstName ?? user.primaryEmailAddress?.emailAddress ?? undefined
  );

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
