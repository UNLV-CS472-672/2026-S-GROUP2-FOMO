'use client';

import { coralPalette } from '@fomo/theme';
import { SimplexNoise } from '@paper-design/shaders-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';

const lightColors = [
  coralPalette[600],
  coralPalette[500],
  coralPalette[300],
  coralPalette[100],
] as const;

const darkColors = [
  coralPalette[200],
  coralPalette[400],
  coralPalette[600],
  coralPalette[800],
] as const;

export default function LandingNoise() {
  const shouldReduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <motion.div
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-90
        lg:mask-[radial-gradient(ellipse_35%_45%_at_50%_100%,white_0%,white_20%,transparent_90%)] 
        mask-[radial-gradient(ellipse_65%_25%_at_50%_90%,white_0%,white_20%,transparent_90%)] 
      `}
      aria-hidden="true"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <SimplexNoise
        width={'100%'}
        height={'100%'}
        colors={[...colors]}
        stepsPerColor={2}
        softness={0}
        speed={1.5}
        scale={0.3}
      />
    </motion.div>
  );
}
