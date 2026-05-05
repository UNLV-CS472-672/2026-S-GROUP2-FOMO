'use client';

import { useAuth } from '@clerk/nextjs';
import { env } from '@fomo/env/web';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import type { ReactNode } from 'react';

const convexUrl = env.NEXT_PUBLIC_CONVEX_URL.replace(/\/+$/, '');
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
