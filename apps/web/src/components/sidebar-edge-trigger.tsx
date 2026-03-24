'use client';

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

export function SidebarEdgeTrigger() {
  const { open, isMobile } = useSidebar();

  return (
    <div
      className="fixed top-4 z-50 transition-[left] duration-200"
      style={{
        left: isMobile ? '1rem' : open ? 'calc(16rem - 1rem)' : 'calc(4.5rem - 1rem)',
      }}
    >
      <SidebarTrigger />
    </div>
  );
}
