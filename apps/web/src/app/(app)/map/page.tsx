export default function MapPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          Map
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Event map UI shell
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          This page is ready for the backend team to drop in the actual map component. The
          surrounding controls, filtering area, and detail panel can all live here.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="min-h-[28rem] rounded-[2rem] border border-dashed border-zinc-300 bg-[linear-gradient(180deg,#fafafa_0%,#f4f4f5_100%)] p-6 dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#171717_0%,#09090b_100%)]">
          <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-zinc-200/80 bg-white/70 text-center dark:border-zinc-800 dark:bg-zinc-950/60">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Map component placeholder
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Backend-owned integration point
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Replace this panel with the real map once the API shape and pins are ready.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Filters</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {['Tonight', 'Free', '18+', 'Live music'].map((filter) => (
                <div
                  key={filter}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {filter}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Event preview</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Use this area for a selected pin summary, quick RSVP actions, or a slide-over trigger.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
