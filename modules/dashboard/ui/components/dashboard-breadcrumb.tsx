'use client'

import { Fragment } from 'react/jsx-runtime'

import { useBreadcrumb } from '@/modules/dashboard/hooks'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

const DashboardBreadcrumb = () => {
  const segments = useBreadcrumb()

  return (
    <header className='sticky top-0 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />

        <Separator
          orientation='vertical'
          className='mr-2 data-[orientation=vertical]:h-4'
        />

        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((seg, idx) => (
              <Fragment key={seg.url + idx}>
                <BreadcrumbItem>
                  {idx < segments.length - 1 ? (
                    <BreadcrumbLink href={seg.url}>{seg.title}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{seg.title}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {idx < segments.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}

export { DashboardBreadcrumb }
