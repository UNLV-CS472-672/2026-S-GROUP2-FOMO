'use client';
import { Header } from '@/components/header';
import { FomoAnimate } from '@/components/logo/animate';
import { Button } from '@/components/ui/button';
import { ClerkLoading, Show } from '@clerk/nextjs';
import { env } from '@fomo/env/web';
import { MapIcon } from 'lucide-react';
import { motion } from 'motion/react';

function StoreBadge({
  href,
  icon,
  storeName,
  label,
}: {
  href?: string;
  icon: React.ReactNode;
  storeName: string;
  label: string;
}) {
  const content = (
    <>
      {icon}
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-medium opacity-80">{label}</span>
        <span className="text-lg font-semibold -mt-0.5">{storeName}</span>
      </div>
    </>
  );

  if (!href) {
    return (
      <Button className="py-6 px-4 h-14 w-44" variant="outline" disabled>
        <span className="flex items-center gap-3 opacity-70">{content}</span>
      </Button>
    );
  }

  return (
    <Button asChild className="py-6 px-4 h-14 w-44" variant="outline">
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
        {content}
      </a>
    </Button>
  );
}

export default function LinksPage() {
  const appStoreUrl = env.NEXT_PUBLIC_APPSTORE_URL;
  const playStoreUrl = env.NEXT_PUBLIC_PLAYSTORE_URL;

  return (
    <>
      <Header />
      <main className="relative mx-auto max-w-screen-2xl px-16 pt-28 min-h-screen flex flex-col w-full items-center justify-center">
        <section>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center text-7xl font-grotesk font-extrabold tracking-tight leading-snug flex md:flex-row flex-col items-center gap-4"
          >
            Get the{' '}
            <FomoAnimate
              className="h-16 w-auto inline-flex shrink overflow-hidden"
              scalePinHeat
              animationDelayMs={1500}
            />{' '}
            app
          </motion.h1>
        </section>

        <div className="flex flex-col items-center gap-6 mt-10 min-h-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            <StoreBadge
              href={appStoreUrl}
              icon={
                <span
                  className="size-7 bg-current"
                  style={{
                    maskImage: 'url(/links/apple.svg)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                  }}
                />
              }
              label={appStoreUrl ? 'Download on the' : 'Coming soon'}
              storeName="App Store"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            <StoreBadge
              href={playStoreUrl}
              icon={
                <span
                  className="size-7 bg-current"
                  style={{
                    maskImage: 'url(/links/android.svg)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                  }}
                />
              }
              label={playStoreUrl ? 'Get it on' : 'Coming soon'}
              storeName="Google Play"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.8 }}
          >
            <Button asChild className="py-6 px-4 h-14 w-44" variant="outline">
              <a href="/map" className="flex items-center gap-3">
                <MapIcon className="size-7" />

                <div className="flex flex-col leading-tight w-full">
                  <span className="text-[11px] font-medium opacity-80">Or right here</span>
                  <span className="text-lg font-semibold -mt-0.5">
                    <ClerkLoading>Try it out</ClerkLoading>
                    <Show when="signed-out">Try it out</Show>
                    <Show when="signed-in">Nearby you</Show>
                  </span>
                </div>
              </a>
            </Button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
