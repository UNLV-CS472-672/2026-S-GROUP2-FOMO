import { Button } from '@/components/ui/button';
import { SignInButton } from '@clerk/nextjs';

export function CreateEventSignedOutFallback() {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        <h1 className="font-grotesk text-2xl font-semibold text-foreground">Create Event</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to publish events and add them to the map.
        </p>
        <SignInButton mode="modal">
          <Button className="mt-5 w-full">Sign in</Button>
        </SignInButton>
      </div>
    </main>
  );
}
