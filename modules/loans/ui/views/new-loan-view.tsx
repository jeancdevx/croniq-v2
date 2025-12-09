import type { Cliente } from '@/db/types'

import { LoanForm } from '../components/loan-form'

interface NewLoanViewProps {
  clients: Cliente[]
}

export function NewLoanView({ clients }: NewLoanViewProps) {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Nuevo Préstamo</h2>
        <p className='text-muted-foreground'>
          Complete el formulario para registrar un nuevo préstamo
        </p>
      </div>

      <div className='bg-card rounded-lg border p-6'>
        <LoanForm clients={clients} />
      </div>
    </div>
  )
}
