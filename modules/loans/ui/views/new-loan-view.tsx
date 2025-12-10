import type { Cliente } from '@/db/types'

import { LoanForm } from '../components/loan-form'

export function NewLoanView() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Nuevo Préstamo</h2>
        <p className='text-muted-foreground'>
          Complete el formulario para registrar un nuevo préstamo
        </p>
      </div>

      <div className='bg-card rounded-lg border p-6'>
        <LoanForm />
      </div>
    </div>
  )
}
