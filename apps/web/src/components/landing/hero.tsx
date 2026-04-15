'use client';

import { FomoAnimate } from '@/components/logo/animate';
import { Show, SignInButton, SignUpButton } from '@clerk/nextjs';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="relative flex items-center justify-center h-full mt-20 overflow-hidden flex-col gap-10">
      {/* logo */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="relative z-10"
      >
        <FomoAnimate className="h-48 w-auto" animationDelayMs={1200} scalePinHeat />
      </motion.div>

      {/* subtitle */}
      <motion.h1
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 1.2 } },
        }}
        className="text-5xl  text-center tracking-tight leading-snug font-grotesk font-extrabold"
      >
        {['Never', 'miss', "what's"].map((word, i) => (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-block mr-[0.3em]"
          >
            {word}
          </motion.span>
        ))}
        <br />
        {['happening', 'around', 'you.'].map((word, i) => (
          <motion.span
            key={i + 3}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-block mr-[0.3em]"
          >
            {word}
          </motion.span>
        ))}
      </motion.h1>

      {/* buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          duration: 0.5,
          delay: 2.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="flex items-center gap-3"
      >
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button size="lg" className="text-xl px-4 py-6" asChild>
              <a href="/map">Try it out</a>
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="lg" variant="outline" className="text-xl px-4 py-6">
              Get started
            </Button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          <Button size="lg" asChild className="text-xl px-4 py-6">
            <a href="/map">Nearby you</a>
          </Button>

          <Button size="lg" asChild variant="outline" className="text-xl px-4 py-6">
            <a href="/events/create">Create event</a>
          </Button>
        </Show>
      </motion.div>
    </section>
  );
}
