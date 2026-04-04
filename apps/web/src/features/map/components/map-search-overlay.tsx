type MapSearchOverlayProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function MapSearchOverlay({ isOpen, onToggle }: MapSearchOverlayProps) {
  return (
    <div className="absolute left-4 right-4 top-3 z-10">
      <button
        type="button"
        className="w-full rounded-xl border border-white/[0.12] bg-[rgba(18,18,18,0.92)] px-4 py-3 text-left active:bg-[rgba(38,38,38,0.92)]"
        onClick={onToggle}
      >
        <span className="text-[15px] text-white/40">Search places...</span>
      </button>

      {isOpen ? (
        <div className="mt-3 rounded-2xl border border-white/[0.12] bg-[rgba(18,18,18,0.96)] p-6 shadow-2xl backdrop-blur">
          <h2 className="text-[30px] font-bold leading-8 text-white">Search</h2>
          <p className="mt-2 text-base leading-6 text-white/70">
            Search by event title, tag, or place name.
          </p>
        </div>
      ) : null}
    </div>
  );
}
