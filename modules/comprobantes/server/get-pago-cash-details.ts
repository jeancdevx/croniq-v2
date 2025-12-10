'use server'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente, cuota, pago, prestamo } from '@/db/schema'

/**
 * Obtiene los detalles completos de un pago en efectivo
 * Incluye: pago, cuota, cliente y préstamo
 */
export async function getPagoCashDetails(pagoId: string) {
  const db = getDb()
  if (!db) throw new Error('No database connection')

  try {
    // 1. Obtener pago con cuota
    const [pagoData] = await db
      .select({
        pago: pago,
        cuota: cuota
      })
      .from(pago)
      .innerJoin(cuota, eq(pago.cuotaId, cuota.id))
      .where(eq(pago.id, pagoId))

    if (!pagoData) {
      throw new Error('Pago no encontrado')
    }

    // 2. Obtener datos del préstamo y cliente
    const [prestamoData] = await db
      .select({
        prestamo: prestamo,
        cliente: cliente
      })
      .from(prestamo)
      .innerJoin(cliente, eq(prestamo.clienteId, cliente.id))
      .where(eq(prestamo.id, pagoData.cuota.prestamoId))

    if (!prestamoData) {
      throw new Error('Préstamo o cliente no encontrado')
    }

    return {
      pago: pagoData.pago,
      cuota: pagoData.cuota,
      prestamo: prestamoData.prestamo,
      cliente: prestamoData.cliente
    }
  } catch (error) {
    console.error('Error getting cash payment details:', error)
    throw error
  }
}
