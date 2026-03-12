import { useConvexAuth } from 'convex/react';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const GUEST_MODE_STORAGE_KEY = 'fomo_guest_mode';

type GuestContextValue = {
  isGuestMode: boolean;
  isGuestLoading: boolean;
  enterGuestMode: () => Promise<void>;
};

const GuestContext = createContext<GuestContextValue | null>(null);

export default function GuestProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrateGuestMode = async () => {
      try {
        const stored = await SecureStore.getItemAsync(GUEST_MODE_STORAGE_KEY);

        if (!isMounted) return;
        if (isAuthenticated) {
          setIsGuestMode(false);
          await SecureStore.deleteItemAsync(GUEST_MODE_STORAGE_KEY);
        } else {
          setIsGuestMode(stored === '1');
        }
      } finally {
        if (isMounted) {
          setIsGuestLoading(false);
        }
      }
    };

    void hydrateGuestMode();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const enterGuestMode = useCallback(async () => {
    setIsGuestMode(true);
    await SecureStore.setItemAsync(GUEST_MODE_STORAGE_KEY, '1');
  }, []);

  const exitGuestMode = useCallback(async () => {
    setIsGuestMode(false);
    await SecureStore.deleteItemAsync(GUEST_MODE_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (isAuthenticated && isGuestMode) {
      void exitGuestMode();
    }
  }, [isAuthenticated, isGuestMode, exitGuestMode]);

  const value = useMemo(
    () => ({
      isGuestMode,
      isGuestLoading,
      enterGuestMode,
    }),
    [enterGuestMode, isGuestMode, isGuestLoading]
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest() {
  const value = useContext(GuestContext);

  if (!value) {
    throw new Error('useGuest must be used within GuestProvider');
  }

  return value;
}
