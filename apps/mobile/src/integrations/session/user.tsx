import { api } from '@fomo/backend/convex/_generated/api';
import { useConvexAuth, useQuery } from 'convex/react';
import { FunctionReturnType } from 'convex/server';
import { createContext, useContext, type ReactNode } from 'react';

const UserContext = createContext<
  FunctionReturnType<typeof api.users.getCurrentProfileMinimal> | undefined | null
>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const userProfile = useQuery(api.users.getCurrentProfileMinimal, isAuthenticated ? {} : 'skip');

  return <UserContext.Provider value={userProfile}>{children}</UserContext.Provider>;
}

const useUser = () => {
  const context = useContext(UserContext);

  if (context === null) throw new Error('user context must be used inside provider');

  return context;
};

export { UserProvider, useUser };
