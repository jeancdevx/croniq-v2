'use client'

import { useState } from 'react'

import { Prestamo } from '@/modules/loans/domain/types'
import { cargarPrestamos } from '@/modules/loans/services/storage'
import { TablaPrestamos } from '@/modules/loans/ui/components/tabla-prestamos'

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>(cargarPrestamos())

  const handlePrestamosActualizados = () => {
    setPrestamos(cargarPrestamos())
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
      <TablaPrestamos
        prestamos={prestamos}
        onPrestamosActualizados={handlePrestamosActualizados}
      />
    </div>
  )
}
