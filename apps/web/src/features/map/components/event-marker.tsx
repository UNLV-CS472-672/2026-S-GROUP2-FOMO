'use client';

import { createRoot, type Root } from 'react-dom/client';

type EventMarkerProps = {
  imageSrc: string | null;
  name: string;
  size: number;
};

type EventMarkerMount = {
  element: HTMLDivElement;
  cleanup: () => void;
};

export function EventMarker({ imageSrc, name, size }: EventMarkerProps) {
  const stemWidth = size * 0.28;
  const stemHeight = size * 0.22;

  return (
    <div className="flex cursor-pointer flex-col items-center">
      <div
        className="overflow-hidden rounded-full border-2 border-amber-500 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
        style={{ width: size, height: size }}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/15 px-2 text-center text-sm font-black uppercase text-primary">
            {name.slice(0, 2)}
          </div>
        )}
      </div>

      <div
        className="-mt-px h-0 w-0 border-l-transparent border-r-transparent border-t-amber-500"
        style={{
          borderLeftWidth: stemWidth / 2,
          borderRightWidth: stemWidth / 2,
          borderTopWidth: stemHeight,
        }}
      />
    </div>
  );
}

export function createEventMarkerMount(props: EventMarkerProps): EventMarkerMount {
  const element = document.createElement('div');
  const root = createRoot(element);
  let didCleanup = false;

  root.render(<EventMarker {...props} />);

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
