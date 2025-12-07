'use client'

import { RegistroPrestamoForm } from '@/modules/loans/ui/components/registro-prestamo-form'

export default function RegistrarPrestamoPage() {
  const handlePrestamoCreado = () => {
    // Mostrar mensaje de éxito o redirigir
    alert('✅ Préstamo registrado exitosamente')
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
      <RegistroPrestamoForm onPrestamoCreado={handlePrestamoCreado} />
    </div>
  )
}
