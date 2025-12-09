import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@clerk/nextjs/server'

import { getAllClients } from '@/modules/loans/data/get-clients'
import { NewLoanView } from '@/modules/loans/ui/views'

export default async function NewLoanPage() {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) redirect('/sign-in')

  const clients = await getAllClients()

  if (clients.length === 0) {
    return (
      <div className='flex flex-col gap-6 p-8'>
        <div>
          <h1 className='text-3xl font-bold'>Nuevo Préstamo</h1>
          <p className='text-muted-foreground'>
            Registra un nuevo préstamo para un cliente
          </p>
        </div>

        <div className='bg-card rounded-lg border p-12 text-center'>
          <h3 className='text-destructive mb-2 text-lg font-semibold'>
            No hay clientes registrados
          </h3>
          <p className='text-muted-foreground mb-4'>
            Debes registrar al menos un cliente antes de crear un préstamo
          </p>
          <Link
            href='/clients'
            className='text-primary inline-flex items-center hover:underline'
          >
            Ir a gestión de clientes →
          </Link>
        </div>
      </div>
    )
  }

  return <NewLoanView clients={clients} />
}
