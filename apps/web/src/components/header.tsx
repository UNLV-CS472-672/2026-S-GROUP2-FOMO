'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export function Header() {
  return (
    <header>
      <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50"
        >
          {/*TODO decide on uppercase lettering or not*/}
          FOMO
        </Link>
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="flex h-9 items-center justify-center rounded-full bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
            >
              Sign in
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton />{' '}
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
