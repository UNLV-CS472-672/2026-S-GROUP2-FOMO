const eventFields = [
  'Event title',
  'Date and time',
  'Location',
  'Category',
  'Description',
  'Visibility',
];

export default function CreateEventPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          Create Event
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Event creation flow
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          This is the form shell for organizers. It is structured like a ShadCN page layout, so you
          can swap the placeholder blocks for `Input`, `Textarea`, `Select`, and `Button` components
          as those land.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid gap-4">
            {eventFields.map((field) => (
              <div key={field} className="space-y-2">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {field}
                </label>
                <div className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 dark:border-zinc-800 dark:bg-zinc-900" />
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Publishing checklist
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li>Add a clear event title.</li>
              <li>Choose an exact place or map pin.</li>
              <li>Set visibility rules before publishing.</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-zinc-950 p-6 text-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-950">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-70">
              Primary action
            </p>
            <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium dark:bg-black/10">
              Publish event button goes here
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
