import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';

export default function AppClerkProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider tokenCache={tokenCache}>{children}</ClerkProvider>;
}
