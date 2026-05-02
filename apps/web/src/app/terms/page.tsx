import { Header } from '@/components/header';
import { TERMS_INTRO, TERMS_LAST_UPDATED, TERMS_SECTIONS } from './constants';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 pb-12 pt-28 md:px-10">
        <section className="rounded-[2rem] border border-border/70 bg-background/80 p-8 shadow-lg backdrop-blur md:p-10">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Terms of Use
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance">
              Fomo Terms of Use
            </h1>
            <p className="text-sm leading-6 text-muted-foreground md:text-base">
              Last updated: {TERMS_LAST_UPDATED}
            </p>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              {TERMS_INTRO}
            </p>
          </div>

          <div className="mt-8 space-y-8">
            {TERMS_SECTIONS.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-6 text-muted-foreground md:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
