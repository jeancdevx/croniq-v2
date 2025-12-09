'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cuota, prestamo } from '@/db/schema'

interface DeleteDraftLoanResult {
  success: boolean
  error?: string
}

/**
 * Elimina un préstamo en estado DRAFT y todas sus cuotas asociadas
 * @param loanId - ID del préstamo a eliminar
 * @returns Resultado de la operación
 */
export async function deleteDraftLoan(
  loanId: string
): Promise<DeleteDraftLoanResult> {
  try {
    const db = getDb()

    // 1. Verificar que el préstamo existe y está en DRAFT
    const [existingLoan] = await db
      .select()
      .from(prestamo)
      .where(eq(prestamo.id, loanId))
      .limit(1)

    if (!existingLoan) {
      return {
        success: false,
        error: 'Préstamo no encontrado'
      }
    }

    if (existingLoan.estado !== 'DRAFT') {
      return {
        success: false,
        error: 'Solo se pueden eliminar préstamos en estado borrador'
      }
    }

    // 2. Eliminar cuotas asociadas (eliminación en cascada manual)
    await db.delete(cuota).where(eq(cuota.prestamoId, loanId))

    // 3. Eliminar préstamo
    await db.delete(prestamo).where(eq(prestamo.id, loanId))

    // 4. Revalidar rutas
    revalidatePath('/loans')

    return { success: true }
  } catch (error) {
    console.error('Error deleting draft loan:', error)
    return {
      success: false,
      error: 'Error al eliminar el préstamo'
    }
  }
}
