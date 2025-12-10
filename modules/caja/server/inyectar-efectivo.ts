'use server'

import { crearMovimientoCaja } from './crear-movimiento-caja'

/**
 * Inyecta efectivo a la caja actual
 * Útil para agregar dinero cuando se necesita dar vueltos
 * @param monto - Cantidad de efectivo a agregar
 * @param descripcion - Motivo de la inyección
 */
export async function inyectarEfectivo(monto: number, descripcion: string) {
  if (monto <= 0) {
    return {
      success: false,
      error: 'El monto debe ser mayor a 0'
    }
  }

  if (!descripcion || descripcion.trim().length < 3) {
    return {
      success: false,
      error: 'Debe proporcionar una descripción (mínimo 3 caracteres)'
    }
  }

  return await crearMovimientoCaja({
    tipo: 'INGRESO',
    categoria: 'INYECCION_EFECTIVO',
    monto,
    descripcion: descripcion.trim()
  })
}
