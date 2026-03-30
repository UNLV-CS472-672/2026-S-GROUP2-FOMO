import Link from 'next/link';

export default function ProfileIndexPage() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_18px_40px_rgba(45,23,18,0.06)]">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Public profiles are routed by handle. The example route is below until you have a real
        handle source.
      </p>
      <Link
        href="/profile/your-handle"
        className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Open sample profile
      </Link>
    </div>
  );
}
