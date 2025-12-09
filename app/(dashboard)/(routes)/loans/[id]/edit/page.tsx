import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@clerk/nextjs/server'

import { getLoanById } from '@/modules/loans/data/get-loan-by-id'
import { EditLoanView } from '@/modules/loans/ui/views/edit-loan-view'

import { Button } from '@/components/ui/button'

interface EditLoanPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditLoanPage({ params }: EditLoanPageProps) {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) redirect('/sign-in')

  const { id } = await params
  const loan = await getLoanById(id)

  if (!loan) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 p-8'>
        <h1 className='text-2xl font-bold'>Préstamo no encontrado</h1>
        <Link href='/loans'>
          <Button>Volver a préstamos</Button>
        </Link>
      </div>
    )
  }

  // Solo se pueden editar préstamos DRAFT
  if (loan.estado !== 'DRAFT') {
    return (
      <div className='flex flex-col items-center justify-center gap-4 p-8'>
        <h1 className='text-2xl font-bold'>No se puede editar este préstamo</h1>
        <p className='text-muted-foreground'>
          Solo se pueden editar préstamos en estado DRAFT
        </p>
        <Link href={`/loans/${id}`}>
          <Button>Volver al préstamo</Button>
        </Link>
      </div>
    )
  }

  return <EditLoanView loan={loan} />
}
