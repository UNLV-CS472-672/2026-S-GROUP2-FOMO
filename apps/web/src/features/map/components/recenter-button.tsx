import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

type RecenterButtonProps = {
  disabled: boolean;
  onClick: () => void;
};

export function RecenterButton({ disabled, onClick }: RecenterButtonProps) {
  return (
    <Button
      aria-label="Recenter map on your location"
      disabled={disabled}
      onClick={onClick}
      className="fixed bottom-6 right-5 z-50 flex size-12 items-center justify-center rounded-full bg-card shadow-sm transition-opacity duration-250 transition-scale hover:scale-103 active:opacity-90 active:scale-96 disabled:opacity-55"
    >
      <Navigation size={20} className="text-primary" />
    </Button>
  );
}
