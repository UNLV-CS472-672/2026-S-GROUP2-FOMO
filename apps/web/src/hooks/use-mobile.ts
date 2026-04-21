import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const getSnapshot = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const getServerSnapshot = () => false;

  const subscribe = (onStoreChange: () => void) => {
    if (typeof window === 'undefined') return () => {};

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener('change', onStoreChange);
    return () => mql.removeEventListener('change', onStoreChange);
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
