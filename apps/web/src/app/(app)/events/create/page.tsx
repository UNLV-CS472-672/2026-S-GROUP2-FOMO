'use client';

import { Show } from '@clerk/nextjs';

import { CreateEventForm } from '@/features/create-event/components/create-event-form';
import { CreateEventSignedOutFallback } from '@/features/create-event/components/signed-out-fallback';

export default function CreateEventPage() {
  return (
    <>
      <Show when="signed-in">
        <CreateEventForm />
      </Show>
      <Show when="signed-out">
        <CreateEventSignedOutFallback />
      </Show>
    </>
  );
}
