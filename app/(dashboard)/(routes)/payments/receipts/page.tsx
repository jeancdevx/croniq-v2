import { getAllPayments } from '@/proxy/payments/actions'

import {
  Receipt,
  ReceiptsList
} from '@/modules/payments/ui/components/receipts-list'

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

export default async function ReceiptsPage() {
  const allPayments = await getAllPayments()

  const receipts: Receipt[] = allPayments
    .filter(p => p.estado === 'Completado')
    .map(p => ({
      id: p.id,
      nroRecibo: p.codigoOperacion || 'S/N',
      cliente: p.clienteNombre,
      fecha: p.fechaPago,
      monto: Number(p.monto),
      estado: 'Emitido',
      urlPdf: '#' // En el futuro se podría generar un PDF real
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
                <BreadcrumbLink href='/payments'>Pagos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>Comprobantes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
        <ReceiptsList receipts={receipts} />
      </div>
    </>
  )
}
