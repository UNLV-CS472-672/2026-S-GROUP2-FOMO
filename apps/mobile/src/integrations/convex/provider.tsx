import { useAuth } from '@clerk/expo';
import { env } from '@fomo/env/mobile';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

const convexUrl = env.EXPO_PUBLIC_CONVEX_URL.replace(/\/+$/, '');

const convex = new ConvexReactClient(convexUrl);

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
