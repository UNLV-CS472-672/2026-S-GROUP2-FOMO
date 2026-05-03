'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@fomo/backend/convex/_generated/api';
import { useMutation } from 'convex/react';
import { MailIcon, MessageSquareIcon } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

const fieldClassName =
  'w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export default function SupportPage() {
  const createSupportRequest = useMutation(api.support.createSupportRequest);

  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    const trimmedDescription = description.trim();

    if (!trimmedEmail) {
      setErrorMessage('Enter an email so we can follow up.');
      return;
    }

    if (!trimmedDescription) {
      setErrorMessage('Add a short description of the issue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createSupportRequest({
        email: trimmedEmail,
        description: trimmedDescription,
      });
      setEmail('');
      setDescription('');
      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 pt-28 pb-12 md:px-10">
        <section className="rounded-[2rem] border border-border/70 bg-background/80 p-8 shadow-lg backdrop-blur md:p-10">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Fomo Support
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance">
              Tell us what you need help with.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Send a quick note and the Fomo team can follow up about account issues, bugs, event
              problems, or anything else you run into.
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              For information about how Fomo handles data, view our{' '}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                privacy policy
              </Link>
              .
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Email</span>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-2xl border-border bg-background/70 pl-11"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Description</span>
              <div className="relative">
                <MessageSquareIcon className="pointer-events-none absolute top-4 left-4 size-4 text-muted-foreground" />
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the issue, question, or feedback you have for Fomo."
                  className={`${fieldClassName} min-h-40 resize-y pl-11`}
                />
              </div>
            </label>

            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

            {isSubmitted ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Your message was sent. We will follow up at the email you provided.
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send support request'}
            </Button>
          </form>
        </section>
      </main>
    </>
  );
}
