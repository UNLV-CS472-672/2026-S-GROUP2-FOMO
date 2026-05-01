import { Header } from '@/components/header';
import { Hero } from '@/components/landing/hero';
import LandingNoise from '@/components/landing/simplex-noise';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="relative isolate mx-auto flex min-h-screen max-w-screen-2xl flex-col px-6 pt-28 md:px-16">
        <Hero />
        <LandingNoise />
        <footer className="mt-auto border-t border-border/60 py-6">
          <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
            <p>Fomo</p>
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                Privacy
              </Link>
              <Link href="/support" className="transition-colors hover:text-foreground">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
