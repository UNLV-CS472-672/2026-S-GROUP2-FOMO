'use client';
import { Show, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Compass } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { FomoLogo } from '../logo';
import { Button } from '../ui/button';
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
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/map">
                <Compass />
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
