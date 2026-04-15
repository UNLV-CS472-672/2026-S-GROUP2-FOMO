'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const cycle = { system: 'light', light: 'dark', dark: 'system' } as const;

type ThemeToggleProps = {
  className?: string;
  iconClassName?: string;
};
export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const { theme = 'system', resolvedTheme, setTheme } = useTheme();

  const mode = useMemo(() => {
    // When theme is "system", resolvedTheme is the actual light/dark choice.
    if (theme === 'system') return 'system' as const;
    return (theme as keyof typeof cycle) ?? 'system';
  }, [theme]);

  const iconMode = useMemo(() => {
    if (theme === 'system') return (resolvedTheme as 'light' | 'dark' | undefined) ?? 'system';
    return (theme as 'light' | 'dark' | 'system') ?? 'system';
  }, [resolvedTheme, theme]);

  const resolvedIconClassName = iconClassName ?? 'h-10 w-10';

  return (
    <Button
      type="button"
      onClick={() => setTheme(cycle[mode] ?? 'system')}
      aria-label="Toggle theme"
      variant="ghost"
      size="icon"
      className={cn('rounded-full transition-all duration-200 h-auto w-auto block p-3', className)}
    >
      {/* Avoid SSR/client mismatch: render a stable icon until mounted */}
      {iconMode === 'system' && <Monitor className={resolvedIconClassName} aria-hidden="true" />}
      {iconMode === 'light' && <Sun className={resolvedIconClassName} aria-hidden="true" />}
      {iconMode === 'dark' && <Moon className={resolvedIconClassName} aria-hidden="true" />}
    </Button>
  );
}
