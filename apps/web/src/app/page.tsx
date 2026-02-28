import { AuthDisplay } from '@/app/components/AuthDisplay';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 rounded-xl bg-white p-10 shadow-sm dark:bg-zinc-950 sm:items-start">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Welcome to FOMO
        </h1>
        <AuthDisplay />
      </main>
    </div>
  );
}
