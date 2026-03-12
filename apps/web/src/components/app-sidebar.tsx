'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
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

function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5Z" />
      <path d="M9 4v13.5" />
      <path d="M15 6.5V20" />
    </svg>
  );
}

function CreateEventIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <path d="M12 13v4M10 15h4" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M10.2 3h3.6l.7 2.1a7.8 7.8 0 0 1 1.9.8L18.5 5l2.5 2.5-1 2.1c.3.6.6 1.3.8 1.9L23 12.2v3.6l-2.1.7a7.8 7.8 0 0 1-.8 1.9l1 2.1-2.5 2.5-2.1-1a7.8 7.8 0 0 1-1.9.8l-.7 2.1h-3.6l-.7-2.1a7.8 7.8 0 0 1-1.9-.8l-2.1 1L3 20.5l1-2.1a7.8 7.8 0 0 1-.8-1.9L1 15.8v-3.6l2.1-.7c.2-.7.5-1.3.8-1.9L3 7.5 5.5 5l2.1 1a7.8 7.8 0 0 1 1.9-.8L10.2 3Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H4" />
    </svg>
  );
}

function SignUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

const navigationItems = [
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/events/create', label: 'Create Event', icon: CreateEventIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
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
          <SignedOut>
            <SidebarMenuItem>
              <SignInButton mode="modal">
                <SidebarMenuButton
                  className={open ? 'justify-start' : 'justify-center px-0'}
                  aria-label="Sign In"
                  title={!open ? 'Sign In' : undefined}
                >
                  <SignInIcon />
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
                  <SignUpIcon />
                  {open ? <span>Create Account</span> : null}
                </SidebarMenuButton>
              </SignUpButton>
            </SidebarMenuItem>
          </SignedOut>

          <SignedIn>
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
                    <ProfileIcon />
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
          </SignedIn>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
