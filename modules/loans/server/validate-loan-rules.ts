'use server'

import { and, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { prestamo } from '@/db/schema'

export async function hasActiveLoan(clienteId: string): Promise<boolean> {
  try {
    const db = getDb()

    const activeLoan = await db
      .select()
      .from(prestamo)
      .where(
        and(eq(prestamo.clienteId, clienteId), eq(prestamo.estado, 'ACTIVO'))
      )
      .limit(1)

    return activeLoan.length > 0
  } catch (error) {
    console.error('Error checking active loan:', error)
    return true
  }
}

export async function validateLoanRules(
  clienteId: string,
  montoSolicitado: number
): Promise<{ valid: boolean; error?: string }> {
  // 1. Verificar préstamo activo
  const hasActive = await hasActiveLoan(clienteId)
  if (hasActive) {
    return {
      valid: false,
      error:
        'El cliente ya tiene un préstamo activo. Debe pagarlo completamente antes de solicitar uno nuevo.'
    }
  }

  // 2. Validar monto mínimo
  if (montoSolicitado < 100) {
    return {
      valid: false,
      error: 'El monto mínimo del préstamo es S/ 100'
    }
  }

  // 3. Validar monto máximo
  if (montoSolicitado > 1000000) {
    return {
      valid: false,
      error: 'El monto máximo del préstamo es S/ 1,000,000'
    }
  }

  return { valid: true }
}
