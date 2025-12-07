'use client'

import Link from 'next/link'

import { ChevronsUpDownIcon, LogOutIcon, UserCircleIcon } from 'lucide-react'

import { SignOutButton, useUser } from '@clerk/nextjs'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'

import { ModeToggle } from './mode-toggle'

const DashboardUserButton = () => {
  const { isMobile } = useSidebar()
  const { user, isLoaded } = useUser()

  if (!isLoaded) return <Skeleton className='h-16 w-full rounded-md' />

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className='cursor-pointer px-1 py-0'>
        <SidebarMenuButton
          size='lg'
          className='group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <UserAvatar
            seed={user?.emailAddresses[0].emailAddress}
            shape='circle'
            className='group-data-[state=collapsed]:aspect-square group-data-[state=collapsed]:size-8'
          />
          <div className='grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden'>
            <span className='truncate text-xs font-medium'>
              {user?.firstName}
            </span>
            <span className='text-muted-foreground truncate text-xs'>
              {user?.emailAddresses[0].emailAddress}
            </span>
          </div>
          <div className='text-sidebar-primary-foreground flex aspect-square items-center justify-center rounded-lg group-data-[state=collapsed]:hidden'>
            <ChevronsUpDownIcon className='mx-auto size-4' />
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
        side={isMobile ? 'bottom' : 'right'}
        align='end'
        sideOffset={4}
      >
        <DropdownMenuLabel className='p-0 font-normal'>
          <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
            <UserAvatar
              seed={user?.emailAddresses[0].emailAddress}
              size='sm'
              shape='circle'
            />
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate text-xs font-medium'>
                {user?.firstName}
              </span>
              <span className='text-muted-foreground truncate text-xs'>
                {user?.emailAddresses[0].emailAddress}
              </span>
            </div>
            <ModeToggle />
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              href='/account'
              className='flex cursor-pointer items-center gap-2 text-xs'
            >
              <UserCircleIcon />
              Mi Cuenta
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className='bg-destructive hover:bg-destructive/70! flex cursor-pointer items-center justify-center text-xs text-white hover:text-white!'>
            <LogOutIcon className='text-white' />
            <SignOutButton>
              <span>Cerrar sesión</span>
            </SignOutButton>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DashboardUserButton }
