import { getData } from '@/modules/clients/data/get-data'
import { RegistroPrestamoForm } from '@/modules/loans/ui/components/registro-prestamo-form'

export default async function RegistrarPrestamoPage() {
  const clientes = await getData()
  console.log('Clientes cargados para registro de préstamo:', clientes.length)

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
      <RegistroPrestamoForm clientes={clientes} />
    </div>
  )
}
