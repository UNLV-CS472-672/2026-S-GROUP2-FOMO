import { useAuth } from '@clerk/expo';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

import { EnsureConvexUser } from '@/integrations/convex/ensure-user';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONVEX_URL in your app env');
}

const convex = new ConvexReactClient(convexUrl);

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const getAuth = () => auth;

  return (
    <ConvexProviderWithClerk client={convex} useAuth={getAuth}>
      {/* Mobile-only: create/link `users` doc on sign-in (web can add the same pattern later). */}
      <EnsureConvexUser />
      {children}
    </ConvexProviderWithClerk>
  );
}
