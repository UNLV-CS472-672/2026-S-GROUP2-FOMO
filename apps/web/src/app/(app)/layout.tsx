import { AppSidebar } from '@/components/app-sidebar';
import { SidebarEdgeTrigger } from '@/components/sidebar-edge-trigger';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarEdgeTrigger />
        <main className="min-w-0 p-4 pt-20 md:p-8 md:pt-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
