'use client';

import { CalendarPlus, Map, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
    </Sidebar>
  );
}
