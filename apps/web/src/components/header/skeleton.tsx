import { Skeleton } from '@/components/ui/skeleton';

export function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <Skeleton className="h-3.5 w-20 min-w-0 max-w-20 shrink-0" />
    </div>
  );
}
