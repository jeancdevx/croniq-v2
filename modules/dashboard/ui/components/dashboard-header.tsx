import Image from 'next/image'

import { ChevronsUpDownIcon } from 'lucide-react'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

const DashboardHeader = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg bg-green-50'>
            <Image src='/logo.svg' alt='Croniq' width={24} height={24} />
          </div>
          <div className='grid flex-1 text-left text-lg leading-tight'>
            <span className='truncate font-bold'>Croniq</span>
          </div>
          <ChevronsUpDownIcon className='ml-auto' />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export { DashboardHeader }
