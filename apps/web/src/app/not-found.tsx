'use client';

import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const REDIRECT_DELAY_MS = 2000;
const TICK_MS = 50;

export default function NotFound() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => router.push('/'), REDIRECT_DELAY_MS);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.min(elapsed / REDIRECT_DELAY_MS, 1);
      setProgress(next);
      if (next >= 1) clearInterval(interval);
    }, TICK_MS);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [router]);

  return (
    <>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-8xl font-bold tracking-tight font-heading">404</h1>
        <div className="w-full flex flex-col gap-2 px-4 pb-4 max-w-md">
          <p className="text-muted-foreground">
            This page doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/"
            className="text-primary underline underline-offset-4 hover:no-underline mb-8"
          >
            Go home
          </Link>

          <span className="text-sm text-muted-foreground text-center">Redirecting…</span>

          <Progress value={progress * 100} className="h-1.5 w-full rounded-none" />
        </div>
      </div>
    </>
  );
}
