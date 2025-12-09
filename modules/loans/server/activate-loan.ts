'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { prestamo } from '@/db/schema'

interface ActivateLoanResult {
  success: boolean
  error?: string
}

export async function activateLoan(
  loanId: string
): Promise<ActivateLoanResult> {
  try {
    const db = getDb()

    // Verificar que el préstamo existe y está en DRAFT
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
        error: 'Solo se pueden activar préstamos en estado borrador'
      }
    }

    // Cambiar estado a ACTIVO
    await db
      .update(prestamo)
      .set({ estado: 'ACTIVO' })
      .where(eq(prestamo.id, loanId))

    revalidatePath('/loans')
    revalidatePath(`/loans/${loanId}`)

    return { success: true }
  } catch (error) {
    console.error('Error activating loan:', error)
    return {
      success: false,
      error: 'Error al activar el préstamo'
    }
  }
}
