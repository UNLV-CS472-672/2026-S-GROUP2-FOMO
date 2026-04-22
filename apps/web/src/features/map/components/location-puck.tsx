'use client';

import { createRoot, type Root } from 'react-dom/client';

type LocationPuckMount = {
  element: HTMLDivElement;
  cleanup: () => void;
};

export function LocationPuck() {
  return (
    <div className="relative flex h-5 w-5 items-center justify-center">
      {/* Outer ping ring */}
      <div className="pointer-events-none absolute -inset-4 rounded-full bg-[#4a90d9]/15 animate-ping animation-duration-2000" />
      {/* Inner pulse glow */}
      <div className="absolute -inset-2 rounded-full bg-[#4a90d9]/12 animate-pulse animation-duration-2000" />
      {/* Center puck */}
      <div className="relative h-full w-full rounded-full border-2 border-white/95 bg-[#4a90d9] shadow-[0_0_0_5px_rgba(74,144,217,0.18)]" />
    </div>
  );
}

export function createLocationPuckMount(): LocationPuckMount {
  const element = document.createElement('div');
  const root = createRoot(element);
  let didCleanup = false;

  root.render(<LocationPuck />);

  return {
    element,
    cleanup: () => {
      if (didCleanup) {
        return;
      }

      didCleanup = true;
      cleanupRoot(root);
    },
  };
}

function cleanupRoot(root: Root) {
  queueMicrotask(() => {
    root.unmount();
  });
}
