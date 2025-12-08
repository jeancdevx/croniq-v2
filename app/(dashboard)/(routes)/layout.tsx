import { DashboardBreadcrumb } from '@/modules/dashboard/ui/components/dashboard-breadcrumb'
import { DashboardSidebar } from '@/modules/dashboard/ui/components/dashboard-sidebar'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset className='m-0!'>
        <DashboardBreadcrumb />

        <div className='container mx-auto min-h-[calc(100vh-4rem)] px-4'>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
