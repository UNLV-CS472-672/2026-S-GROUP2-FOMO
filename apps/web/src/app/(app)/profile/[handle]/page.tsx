type ProfilePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

function formatHandle(handle: string) {
  return handle.replace(/^@+/, '');
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const cleanHandle = formatHandle(handle);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Profile
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              @{cleanHandle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              This route is set up for public profile URLs, similar to Instagram-style handles. When
              user data is ready, fetch by handle here and render their events, bio, and follow
              state.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ['24', 'Events'],
              ['2.1k', 'Followers'],
              ['312', 'Following'],
            ].map(([value, label]) => (
              <div
                key={label}
                className="min-w-24 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{value}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-xl font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
              {cleanHandle.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {cleanHandle}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Handle-based public identity
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Bio, badges, joined date, and location can live in this column without changing the
            route shape.
          </p>
        </aside>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Upcoming events</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {['Late Night DJ Set', 'Campus Pop-Up', 'Indie Showcase', 'Sunday Brunch'].map(
              (eventName) => (
                <div
                  key={eventName}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    {eventName}
                  </div>
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Placeholder event card for profile activity.
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
