import { useAuth } from '@clerk/expo';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

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
      {children}
    </ConvexProviderWithClerk>
  );
}
