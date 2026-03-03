'use client';

import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';

export default function Home() {
  const identity = useQuery(api.auth.getIdentity);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 rounded-xl bg-white p-10 shadow-sm dark:bg-zinc-950 sm:items-start">
        {identity !== undefined && identity !== null ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Welcome,{' '}
              {(identity.name ?? identity.email ?? 'there')
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')}
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              You&apos;re signed in.
            </p>
          </>
        ) : identity === null ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Welcome to FOMO
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Sign in with the button in the top right to access your account.
            </p>
          </>
        ) : (
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">Loading...</p>
        )}
      </main>
    </div>
  );
}
