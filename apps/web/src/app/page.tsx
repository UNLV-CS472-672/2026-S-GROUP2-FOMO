import { Header } from '@/components/header';
import { Hero } from '@/components/landing/hero';
import LandingNoise from '@/components/landing/simplex-noise';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="relative mx-auto max-w-screen-2xl px-16 pt-28">
        <Hero />
        <LandingNoise />
      </main>
    </>
  );
}
