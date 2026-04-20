'use client';

import { createRoot, type Root } from 'react-dom/client';

type LocationPuckMount = {
  element: HTMLDivElement;
  cleanup: () => void;
};

export function LocationPuck() {
  return (
    <div className="relative h-[18px] w-[18px] rounded-full border-2 border-white/95 bg-[#4a90d9] shadow-[0_0_0_10px_rgba(74,144,217,0.18)]">
      <div className="pointer-events-none absolute inset-[-16px] animate-[mapbox-pulse_1.8s_ease-out_infinite] rounded-full bg-[rgba(74,144,217,0.16)]" />
      <style jsx>{`
        @keyframes mapbox-pulse {
          0% {
            transform: scale(0.5);
            opacity: 0.85;
          }

          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export function createLocationPuckMount(): LocationPuckMount {
  const element = document.createElement('div');
  const root = createRoot(element);

  root.render(<LocationPuck />);

  return {
    element,
    cleanup: () => {
      cleanupRoot(root);
    },
  };
}

function cleanupRoot(root: Root) {
  root.unmount();
}
