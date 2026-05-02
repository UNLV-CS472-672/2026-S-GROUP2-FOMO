'use client';

import { useUser } from '@clerk/nextjs';

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
          Welcome to Fomo
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Sign in with the button in the top right to access your account.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Welcome, {user.username ?? 'there'}
      </h1>
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        You&apos;re signed in.
      </p>
    </>
  );
}
