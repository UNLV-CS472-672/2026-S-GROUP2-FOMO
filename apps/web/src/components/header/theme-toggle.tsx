import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme = 'system', setTheme } = useTheme();

  return (
    <div className="flex gap-1 rounded-lg bg-muted/60 p-0.5" role="group" aria-label="Theme">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Light"
        className={cn(
          'flex-1 rounded-md',
          theme === 'light'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
      >
        <SunIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Dark"
        className={cn(
          'flex-1 rounded-md',
          theme === 'dark'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
      >
        <MoonIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="System"
        className={cn(
          'flex-1 rounded-md',
          theme === 'system'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setTheme('system')}
        aria-pressed={theme === 'system'}
      >
        <MonitorIcon className="size-4" />
      </Button>
    </div>
  );
}
