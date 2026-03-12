import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-zinc-100 px-4 py-10 dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            FOMO web
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Start with the signed-in shell, then connect live data behind it.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            The sidebar and route structure are the right first step here. Map, event creation, and
            profile now have dedicated pages you can iterate on independently.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/map"
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
            >
              Open app shell
            </Link>
            <Link
              href="/profile/your-handle"
              className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-950"
            >
              View sample profile
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              href: '/map',
              title: 'Map',
              body: 'Reserved for the backend-provided map with UI controls already in place.',
            },
            {
              href: '/events/create',
              title: 'Create an Event',
              body: 'Form shell for organizers with space for ShadCN inputs and actions.',
            },
            {
              href: '/profile/your-handle',
              title: 'Profile',
              body: 'Handle-based public route like `/profile/jane` for shareable user pages.',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{item.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
