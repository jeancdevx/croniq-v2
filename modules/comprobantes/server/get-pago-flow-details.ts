'use server'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente, cuota, pago, pagoFlow, prestamo } from '@/db/schema'

/**
 * Obtiene los detalles completos de un pago Flow
 * Incluye: pago_flow, todos los pagos asociados, cuotas, cliente y préstamo
 */
export async function getPagoFlowDetails(pagoFlowId: string) {
  const db = getDb()
  if (!db) throw new Error('No database connection')

  try {
    // 1. Obtener pago_flow
    const [pagoFlowData] = await db
      .select()
      .from(pagoFlow)
      .where(eq(pagoFlow.id, pagoFlowId))

    if (!pagoFlowData) {
      throw new Error('Pago Flow no encontrado')
    }

    // 2. Obtener todos los pagos asociados a este pago_flow
    const pagos = await db
      .select({
        pago: pago,
        cuota: cuota
      })
      .from(pago)
      .innerJoin(cuota, eq(pago.cuotaId, cuota.id))
      .where(eq(pago.pagoFlowId, pagoFlowId))
      .orderBy(cuota.numeroCuota)

    if (pagos.length === 0) {
      throw new Error('No se encontraron pagos asociados')
    }

    // 3. Obtener datos del préstamo y cliente
    const [prestamoData] = await db
      .select({
        prestamo: prestamo,
        cliente: cliente
      })
      .from(prestamo)
      .innerJoin(cliente, eq(prestamo.clienteId, cliente.id))
      .where(eq(prestamo.id, pagoFlowData.prestamoId!))

    if (!prestamoData) {
      throw new Error('Préstamo o cliente no encontrado')
    }

    return {
      pagoFlow: pagoFlowData,
      pagos: pagos.map(p => ({
        pago: p.pago,
        cuota: p.cuota
      })),
      prestamo: prestamoData.prestamo,
      cliente: prestamoData.cliente
    }
  } catch (error) {
    console.error('Error getting pago flow details:', error)
    throw error
  }
}
