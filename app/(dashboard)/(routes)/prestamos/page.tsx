import { getLoans } from '@/modules/loans/data/get-loans'
import { TablaPrestamos } from '@/modules/loans/ui/components/tabla-prestamos'

export default async function PrestamosPage() {
  const prestamos = await getLoans()

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
      <TablaPrestamos prestamos={prestamos} />
    </div>
  )
}
