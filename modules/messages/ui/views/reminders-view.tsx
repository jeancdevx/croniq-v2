'use client'

import { useEffect, useState } from 'react'

import { getDebtors } from '../../data'
import type { Debtor } from '../../types'
import { columns } from '../components/columns'
import { DataTable } from '../components/data-table'

export function RemindersView() {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDebtors() {
      const data = await getDebtors()
      setDebtors(data)
      setLoading(false)
    }
    loadDebtors()
  }, [])

  if (loading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='text-muted-foreground'>Cargando...</div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className='flex justify-between'>
        <div className='flex flex-col gap-y-1'>
          <h4 className='text-4xl font-bold'>Recordatorios</h4>
          <p className='text-muted-foreground'>
            Gestiona y envía recordatorios de pago por WhatsApp
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className='container mx-auto py-4'>
        <DataTable columns={columns} data={debtors} />
      </div>

      {/* Footer */}
      <div className='text-muted-foreground mt-8 flex items-center justify-center gap-2 pb-8 text-sm'>
        <span>Powered by</span>
        <img src='/Logos-7.png' alt='Logo' className='h-6 w-auto' />
      </div>
    </>
  )
}
