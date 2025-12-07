'use client'

import { sidebarData } from '@/modules/dashboard/constants'

import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar'

import { DashboardHeader } from './dashboard-header'
import { DashboardUserButton } from './dashboard-user-button'
import { NavigationMain } from './navigation-main'
import { NavigationProjects } from './navigation-projects'

const DashboardSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar
      variant='inset'
      collapsible='icon'
      className='py-0 pl-2'
      {...props}
    >
      <SidebarHeader>
        <DashboardHeader />
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <NavigationMain items={sidebarData.navMain} />
        <NavigationProjects projects={sidebarData.projects} />
      </SidebarContent>

      <Separator />

      <SidebarFooter className='h-16 px-1 group-data-[state=collapsed]:px-2 group-data-[state=collapsed]:py-3'>
        <DashboardUserButton />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export { DashboardSidebar }
