'use client';

import { createRoot, type Root } from 'react-dom/client';

type EventMarkerProps = {
  imageSrc: string | null;
  name: string;
  size: number;
  isActive?: boolean;
};

type EventMarkerMount = {
  element: HTMLDivElement;
  cleanup: () => void;
};

export function EventMarker({ imageSrc, name, size, isActive = true }: EventMarkerProps) {
  const stemWidth = size * 0.28;
  const stemHeight = size * 0.22;
  const borderColor = isActive ? 'border-amber-500' : 'border-zinc-400';
  const stemColor = isActive ? 'border-t-amber-500' : 'border-t-zinc-400';
  const fallbackBg = isActive ? 'bg-primary/15 text-primary' : 'bg-zinc-100 text-zinc-400';

  return (
    <div
      className="flex cursor-pointer flex-col items-center"
      style={{ opacity: isActive ? 1 : 0.7 }}
    >
      <div
        className={`overflow-hidden rounded-full border-2 ${borderColor} shadow-[0_4px_12px_rgba(0,0,0,0.35)]`}
        style={{ width: size, height: size }}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center px-2 text-center text-sm font-black uppercase ${fallbackBg}`}
          >
            {name.slice(0, 2)}
          </div>
        )}
      </div>

      <div
        className={`-mt-px h-0 w-0 border-l-transparent border-r-transparent ${stemColor}`}
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
