'use client'

import { sidebarData } from '@/modules/dashboard/constants'

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
    <Sidebar variant='inset' collapsible='icon' {...props}>
      <SidebarHeader>
        <DashboardHeader />
      </SidebarHeader>

      <SidebarContent>
        <NavigationMain items={sidebarData.navMain} />
        <NavigationProjects projects={sidebarData.projects} />
      </SidebarContent>

      <SidebarFooter className='h-16'>
        <DashboardUserButton />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export { DashboardSidebar }
