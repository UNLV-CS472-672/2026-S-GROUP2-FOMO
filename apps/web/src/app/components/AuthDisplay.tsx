'use client';
import { Authenticated, Unauthenticated } from 'convex/react';
import Link from 'next/link';

export const AuthDisplay = () => (
  <>
    <Unauthenticated>
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Sign in to access your account and manage your FOMO experience.
      </p>
      <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
        <Link
          href="/sign-in"
          className="flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Create an account
        </Link>
      </div>
    </Unauthenticated>
    <Authenticated>
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        You&apos;re signed in. Head to the auth demo page to see your backend user ID.
      </p>
      <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
        <Link
          href="/auth-demo"
          className="flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          Go to auth demo
        </Link>
      </div>
    </Authenticated>
  </>
);
