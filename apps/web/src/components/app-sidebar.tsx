'use client';

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { CalendarPlus, LogIn, Map, Settings, User, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  { href: '/map', label: 'Map', icon: Map },
  { href: '/events/create', label: 'Create Event', icon: CalendarPlus },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

function isRouteActive(pathname: string, href: string) {
  if (href === '/profile') {
    return pathname === '/profile' || pathname.startsWith('/profile/');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/'}
              className={open ? 'justify-start' : 'justify-center px-0'}
            >
              <Link href="/" className={open ? 'min-w-0' : 'justify-center'}>
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
                  F
                </span>
                {open ? <span>FOMO</span> : null}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {open ? <SidebarGroupLabel>Navigation</SidebarGroupLabel> : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isRouteActive(pathname, item.href)}
                      className={open ? 'justify-start' : 'justify-center px-0'}
                    >
                      <Link
                        href={item.href}
                        aria-label={item.label}
                        title={!open ? item.label : undefined}
                        className={open ? 'min-w-0' : 'justify-center'}
                      >
                        <Icon />
                        {open ? <span>{item.label}</span> : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <Show when="signed-out">
            <SidebarMenuItem>
              <SignInButton mode="modal">
                <SidebarMenuButton
                  className={open ? 'justify-start' : 'justify-center px-0'}
                  aria-label="Sign In"
                  title={!open ? 'Sign In' : undefined}
                >
                  <LogIn className="h-4 w-4" />
                  {open ? <span>Sign In</span> : null}
                </SidebarMenuButton>
              </SignInButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SignUpButton mode="modal">
                <SidebarMenuButton
                  className={open ? 'justify-start' : 'justify-center px-0'}
                  aria-label="Create Account"
                  title={!open ? 'Create Account' : undefined}
                >
                  <UserPlus className="h-4 w-4" />
                  {open ? <span>Create Account</span> : null}
                </SidebarMenuButton>
              </SignUpButton>
            </SidebarMenuItem>
          </Show>

          <Show when="signed-in">
            <SidebarMenuItem>
              <div
                className={[
                  'relative rounded-xl border border-zinc-200 dark:border-zinc-800',
                  isRouteActive(pathname, '/profile')
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'bg-transparent',
                ].join(' ')}
              >
                <SidebarMenuButton
                  asChild
                  isActive={false}
                  className={[
                    'w-full',
                    open ? 'justify-start pr-14' : 'justify-center px-0',
                    isRouteActive(pathname, '/profile')
                      ? 'text-white hover:bg-transparent dark:text-zinc-950 dark:hover:bg-transparent'
                      : '',
                  ].join(' ')}
                >
                  <Link
                    href="/profile"
                    aria-label="Profile"
                    title={!open ? 'Profile' : undefined}
                    className={open ? 'min-w-0' : 'justify-center'}
                  >
                    <User className="h-4 w-4" />
                    {open ? <span>Profile</span> : null}
                  </Link>
                </SidebarMenuButton>
                <div
                  className={[
                    'absolute inset-y-0 z-10 flex items-center',
                    open ? 'right-2' : 'inset-x-0 flex justify-center',
                  ].join(' ')}
                >
                  <UserButton />
                </div>
              </div>
            </SidebarMenuItem>
          </Show>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
