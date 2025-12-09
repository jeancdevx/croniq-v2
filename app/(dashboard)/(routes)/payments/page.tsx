import { getAllPayments } from '@/proxy/payments/actions'

import { Pago } from '@/modules/payments/domain/types'
import { PaymentsTable } from '@/modules/payments/ui/components/payments-table'

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

export default async function PaymentsPage() {
  const allPayments = await getAllPayments()

  // Ensure type compatibility
  const pagos: Pago[] = allPayments.map(p => ({
    ...p,
    codigoOperacion: p.codigoOperacion || undefined,
    url: p.url || undefined,
    type: p.type as 'FLOW' | 'CASH' | undefined,
    estado: p.estado as 'Completado' | 'Pendiente' | 'Fallido'
  }))

  return (
    <>
      <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
        <div className='flex items-center gap-2 px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink href='#'>Pagos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>Listado de Pagos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
        <PaymentsTable pagos={pagos} />
      </div>
    </>
  )
}
