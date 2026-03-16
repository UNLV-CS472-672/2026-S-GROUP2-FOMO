import Link from 'next/link';

export default function ProfileIndexPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Profile
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Public profiles are routed by handle. The example route is below until you have a real
        handle source.
      </p>
      <Link
        href="/profile/your-handle"
        className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950"
      >
        Open sample profile
      </Link>
    </div>
  );
}
