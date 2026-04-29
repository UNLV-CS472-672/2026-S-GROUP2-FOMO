import type { ReactNode } from 'react';

type CreateEventFieldProps = {
  label: string;
  children: ReactNode;
  action?: ReactNode;
  error?: string;
  icon?: ReactNode;
};

export function CreateEventField({ label, children, action, error, icon }: CreateEventFieldProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-muted-foreground">
          {icon}
          <span className="uppercase">{label}</span>
        </div>
        {action}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
