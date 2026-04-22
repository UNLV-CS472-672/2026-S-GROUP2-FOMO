'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { CSSProperties, ReactNode } from 'react';

const HEADER_HEIGHT = '4rem';

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <SidebarProvider style={{ '--header-height': HEADER_HEIGHT } as CSSProperties}>
      <AppHeader />
      <div className="flex w-full" style={{ paddingTop: HEADER_HEIGHT }}>
        <AppSidebar />
        <SidebarInset className="relative" style={{ minHeight: `calc(100svh - ${HEADER_HEIGHT})` }}>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
