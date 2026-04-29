import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocateFixed } from 'lucide-react';

type RecenterButtonProps = {
  disabled: boolean;
  offsetForEventPanel?: boolean;
  onClick: () => void;
};

export function RecenterButton({
  disabled,
  offsetForEventPanel = false,
  onClick,
}: RecenterButtonProps) {
  return (
    <Button
      aria-label="Recenter map on your location"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-5 z-50 flex size-12 items-center justify-center rounded-full bg-card shadow-sm transition-[opacity,scale,right] duration-250 hover:scale-103 active:scale-96 active:opacity-90 disabled:opacity-55',
        offsetForEventPanel && 'md:right-[calc(min(28rem,calc(100vw_-_2rem))_+_1.25rem)]'
      )}
    >
      <LocateFixed size={20} className="text-primary" />
    </Button>
  );
}
