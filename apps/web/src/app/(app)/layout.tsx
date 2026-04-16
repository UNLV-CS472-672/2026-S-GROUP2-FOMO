'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { CSSProperties, ReactNode } from 'react';

const HEADER_HEIGHT = '3.0rem';

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <SidebarProvider style={{ '--header-height': HEADER_HEIGHT } as CSSProperties}>
      <AppHeader />
      <div className="flex w-full mt-4" style={{ paddingTop: HEADER_HEIGHT }}>
        <AppSidebar />
        <SidebarInset className="relative min-h-[calc(100vh-3.5rem)]">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
