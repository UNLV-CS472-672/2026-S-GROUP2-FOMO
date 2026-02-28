import { useAuth } from '@clerk/clerk-expo';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

const convexQueryClient = new ConvexQueryClient(process.env.EXPO_PUBLIC_CONVEX_URL);

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convexQueryClient.convexClient} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
