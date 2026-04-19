'use client';

import { ClerkProvider as ClerkNextProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
import type { ReactNode } from 'react';

export function ClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkNextProvider
      afterSignOutUrl="/"
      appearance={{
        theme: shadcn,
      }}
    >
      {children}
    </ClerkNextProvider>
  );
}
