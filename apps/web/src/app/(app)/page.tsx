import Link from 'next/link';

export default function AppHomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          FOMO
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Web app shell
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          The root route now lives inside the main app shell, so the sidebar is part of the default
          experience instead of a separate landing page.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            href: '/map',
            title: 'Map',
            body: 'Reserved for the backend-provided map and related controls.',
          },
          {
            href: '/events/create',
            title: 'Create Event',
            body: 'Event creation route with the initial page scaffold in place.',
          },
          {
            href: '/profile/your-handle',
            title: 'Profile',
            body: 'Handle-based public profile route for shareable user pages.',
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
    </div>
  );
}
