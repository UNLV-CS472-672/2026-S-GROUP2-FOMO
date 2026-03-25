export default function MapSearchPage() {
  return (
    <section className="flex min-h-[calc(100vh-7rem)] flex-col gap-2 bg-background p-6">
      <h1 className="text-[30px] font-bold leading-8 text-foreground">Search</h1>
      <p className="text-base leading-6 text-foreground">
        Search by event title, tag, or place name.
      </p>
    </section>
  );
}
