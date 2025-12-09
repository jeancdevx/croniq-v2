import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@clerk/nextjs/server'

import { getLoanById } from '@/modules/loans/data/get-loan-by-id'
import { LoanDetailActiveView } from '@/modules/loans/ui/views/loan-detail-active-view'
import { LoanDetailDraftView } from '@/modules/loans/ui/views/loan-detail-draft-view'

import { Button } from '@/components/ui/button'

interface LoanDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
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

  // Mostrar vista diferente según el estado
  if (loan.estado === 'DRAFT') {
    return <LoanDetailDraftView loan={loan} />
  }

  return <LoanDetailActiveView loan={loan} />
}
