'use client';

import { SignedIn, SignedOut, SignOutButton } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import Link from 'next/link';

export default function AuthDemoPage() {
  const identity = useQuery(anyApi.auth.getIdentity, {});
  console.log('identity', identity);

  const loading = identity === undefined || identity === null;
  const username = identity?.nickname;
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex flex-col items-start gap-4 rounded-xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Auth state example
        </h1>

        <SignedIn>
          <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
            <p>You are currently signed in.</p>
            {loading ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Loading user ID from backend…
              </p>
            ) : username ? (
              <p className="text-sm">
                Backend user ID is{' '}
                <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
                  {username}
                </code>
              </p>
            ) : (
              <p className="text-sm text-red-500">Could not load user ID from backend.</p>
            )}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This section is only visible inside the{' '}
              <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
                {'<SignedIn>'}
              </code>{' '}
              wrapper.
            </p>
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-full bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
            >
              Go back home
            </Link>
          </div>

          <SignOutButton redirectUrl="/">
            <button className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-white">
              Sign out
            </button>
          </SignOutButton>
        </SignedIn>

        <SignedOut>
          <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
            <p>You are currently signed out.</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This section is only visible inside the{' '}
              <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
                {'<SignedOut>'}
              </code>{' '}
              wrapper.
            </p>
            <div className="flex gap-2">
              <Link
                href="/sign-in"
                className="inline-flex h-9 items-center rounded-full bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-9 items-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Create account
              </Link>
            </div>
          </div>
        </SignedOut>
      </div>
    </main>
  );
}
