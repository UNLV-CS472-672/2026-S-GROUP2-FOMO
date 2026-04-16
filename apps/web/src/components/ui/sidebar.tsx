'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Slot } from '@radix-ui/react-slot';
import { PanelLeft } from 'lucide-react';
import * as React from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_ICON = '4.5rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';

type SidebarContextValue = {
  isMobile: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  state: 'expanded' | 'collapsed';
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

type SidebarProviderProps = React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  style,
  className,
  children,
  ...props
}: SidebarProviderProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);
  const isMobile = useIsMobile();

  const open = openProp ?? internalOpen;
  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const nextOpen = typeof value === 'function' ? value(open) : value;

      if (openProp === undefined) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [onOpenChange, open, openProp]
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((current) => !current);
      return;
    }

    setOpen((current) => !current);
  }, [isMobile, setOpen]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = event.key.toLowerCase() === 'b' && (event.metaKey || event.ctrlKey);
      if (!isShortcut) {
        return;
      }

      event.preventDefault();
      toggleSidebar();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSidebar]);

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      isMobile,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      state: open ? 'expanded' : 'collapsed',
    }),
    [isMobile, open, setOpen, openMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-provider"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            '--sidebar-width-mobile': SIDEBAR_WIDTH_MOBILE,
            ...style,
          } as React.CSSProperties
        }
        className={cn('flex min-h-screen w-full items-start', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

type SidebarProps = React.ComponentProps<'aside'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
};

export function Sidebar({
  side = 'left',
  variant = 'inset',
  collapsible = 'icon',
  className,
  children,
  ...props
}: SidebarProps) {
  const { isMobile, open, openMobile, setOpenMobile, state } = useSidebar();
  const desktopWidth =
    collapsible === 'icon' && !open ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)';
  const shellClasses =
    variant === 'floating'
      ? 'm-3 rounded-3xl border border-border bg-surface shadow-[0_24px_64px_rgba(45,23,18,0.08)]'
      : 'border-border bg-surface';

  const content = (
    <aside
      data-slot="sidebar"
      data-state={state}
      data-collapsible={collapsible}
      data-variant={variant}
      data-side={side}
      className={cn(
        'flex h-full flex-col overflow-hidden transition-[width,transform] duration-200',
        variant === 'inset' || variant === 'sidebar' ? 'border-r' : '',
        collapsible === 'offcanvas' ? (open ? 'translate-x-0' : '-translate-x-full') : '',
        shellClasses,
        className
      )}
      style={{ width: desktopWidth }}
      {...props}
    >
      {children}
    </aside>
  );

  if (isMobile) {
    return (
      <Dialog.Root open={openMobile} onOpenChange={setOpenMobile}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width-mobile)] border-r border-border bg-surface p-0 shadow-xl outline-none">
            <Dialog.Title className="sr-only">Sidebar</Dialog.Title>
            <div className="flex h-full flex-col">{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <div
      className="sticky top-0 h-screen shrink-0 self-start overflow-hidden transition-[width] duration-200"
      style={{ width: desktopWidth }}
    >
      {content}
    </div>
  );
}

export function SidebarTrigger({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      onClick={toggleSidebar}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
      {...props}
    >
      <span className="sr-only">Toggle sidebar</span>
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}

export function SidebarInset({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn('min-w-0 flex-1 self-stretch bg-background', className)}
      {...props}
    />
  );
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn('border-b border-border p-3', className)}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn('mt-auto border-t border-border p-3', className)}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('flex flex-1 flex-col overflow-y-auto p-3', className)}
      {...props}
    />
  );
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<'section'>) {
  return <section data-slot="sidebar-group" className={cn('mb-4', className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        'mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sidebar-group-content" className={cn(className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul data-slot="sidebar-menu" className={cn('space-y-1', className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="sidebar-menu-item" className={cn(className)} {...props} />;
}

type SidebarMenuButtonProps = React.ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
};

export function SidebarMenuButton({
  asChild,
  isActive,
  className,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive ? 'true' : 'false'}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isActive
          ? 'bg-primary text-primary-foreground shadow-[0_16px_30px_rgba(198,29,8,0.16)]'
          : 'text-foreground hover:bg-primary-soft hover:text-primary-text',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
