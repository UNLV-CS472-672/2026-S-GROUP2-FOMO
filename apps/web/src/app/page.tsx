'use client';

import { SignedInStatus } from '@/app/components/SignedInStatus';
import { api } from '@fomo/backend/convex/_generated/api';
import { useQuery } from 'convex/react';

export default function Home() {
  const identity = useQuery(api.auth.getIdentity);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 rounded-xl bg-white p-10 shadow-sm dark:bg-zinc-950 sm:items-start">
        <SignedInStatus identity={identity} />
      </main>
    </div>
  );
}
