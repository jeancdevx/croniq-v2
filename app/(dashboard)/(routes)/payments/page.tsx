import { getFlowPayments } from '@/minibackend/payments/actions'

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
  const flowPayments = await getFlowPayments()

  const pagos: Pago[] = flowPayments.map(p => ({
    id: p.id,
    clienteNombre: p.concepto,
    clienteDni: p.email,
    fechaPago: p.fechaPago || p.fechaCreacion,
    monto: Number(p.monto),
    medioPago: 'Flow',
    codigoOperacion: p.flowOrder,
    estado:
      p.estado === 'PAGADO'
        ? 'Completado'
        : p.estado === 'PENDIENTE'
          ? 'Pendiente'
          : 'Fallido',
    url: p.url || undefined
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
