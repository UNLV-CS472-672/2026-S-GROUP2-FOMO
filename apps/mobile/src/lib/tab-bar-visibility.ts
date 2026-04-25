import { useSyncExternalStore } from 'react';

let isTabBarHidden = false;

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function setTabBarHidden(nextValue: boolean) {
  if (isTabBarHidden === nextValue) {
    return;
  }

  isTabBarHidden = nextValue;
  emitChange();
}

export function useTabBarHidden() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => isTabBarHidden,
    () => isTabBarHidden
  );
}
