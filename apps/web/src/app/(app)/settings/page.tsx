import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function SettingsPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Settings
      </h1>
      <div>
        <div className="flex items-center justify-start gap-4 mt-10">
          <h2>Select Theme</h2>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
