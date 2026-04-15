'use client';
import { MapSearchOverlay } from '@/features/map/components/map-search-overlay';
import { Show, SignInButton, SignUpButton } from '@clerk/nextjs';
import { MapIcon, MenuIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { FomoLogo } from '../logo';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { UserButton } from './user-button';

export function Header() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={shouldReduceMotion ? { opacity: 1 } : { y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-lg dark:shadow-2xl backdrop-blur-lg rounded-b-4xl"
    >
      <div className="mx-auto flex w-full  tems-center justify-between px-6 py-4 md:px-16">
        <div className="inline-flex">
          <Link href="/" className="group/fomo-animate inline-flex transform-gpu">
            <FomoLogo className="h-12" scalePinHeat />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <Button asChild className="hidden sm:inline-flex  px-6 py-5 rounded-3xl">
              <Link href="/map">
                <MapIcon />
                Map
              </Link>
            </Button>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <>
              <SignInButton mode="modal" forceRedirectUrl="/map" fallbackRedirectUrl="/map">
                <Button variant="ghost" size={'lg'}>
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size={'lg'}>Create account</Button>
              </SignUpButton>
            </>
          </Show>
        </div>
      </div>
    </motion.header>
  );
}
export function AppHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed top-0 h-16 left-0 right-0 z-50 flex items-center justify-between gap-4 border-b border-border bg-background px-5 py-2 pb-1">
      <div className="flex items-center gap-7">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <MenuIcon className="h-10 w-10" />
        </Button>
        <Link href="/" className="group/fomo-animate inline-flex transform-gpu">
          <FomoLogo className="h-12" scalePinHeat />
        </Link>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <MapSearchOverlay />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Show when="signed-in">
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal" forceRedirectUrl="/map" fallbackRedirectUrl="/map">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm">Create account</Button>
          </SignUpButton>
        </Show>
      </div>
    </header>
  );
}
