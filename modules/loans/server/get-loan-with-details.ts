'use server'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente, cuota, prestamo } from '@/db/schema'
import type { PrestamoConCuotas } from '@/db/types'

/**
 * Obtiene un préstamo con todas sus cuotas y datos del cliente
 * @param loanId - ID del préstamo
 * @returns Préstamo completo o null si no existe
 */
export async function getLoanWithDetails(
  loanId: string
): Promise<PrestamoConCuotas | null> {
  try {
    const db = getDb()

    // Obtener préstamo con cliente
    const [loanData] = await db
      .select()
      .from(prestamo)
      .leftJoin(cliente, eq(prestamo.clienteId, cliente.id))
      .where(eq(prestamo.id, loanId))
      .limit(1)

    if (!loanData || !loanData.prestamo) {
      return null
    }

    // Obtener todas las cuotas ordenadas
    const cuotas = await db
      .select()
      .from(cuota)
      .where(eq(cuota.prestamoId, loanId))
      .orderBy(cuota.numeroCuota)

    // Construir objeto completo
    const prestamoCompleto: PrestamoConCuotas = {
      ...loanData.prestamo,
      cliente: loanData.cliente!,
      cuotas
    }

    return prestamoCompleto
  } catch (error) {
    console.error('Error fetching loan with details:', error)
    return null
  }
}
