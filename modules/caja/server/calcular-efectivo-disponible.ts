'use server'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cajaSesion, movimientoCaja } from '@/db/schema'

/**
 * Calcula el efectivo físico disponible en la caja actual
 * Solo cuenta movimientos que afectan el efectivo físico:
 * - INGRESOS: CAPITAL_INICIAL, PAGO_EFECTIVO, INYECCION_EFECTIVO
 * - EGRESOS: DESEMBOLSO, RETIRO_EFECTIVO
 *
 * NO cuenta PAGO_TARJETA porque ese dinero no está físicamente en caja
 */
export async function calcularEfectivoDisponible(): Promise<{
  success: boolean
  efectivoDisponible?: number
  error?: string
}> {
  const db = getDb()
  if (!db) return { success: false, error: 'No database connection' }

  try {
    // 1. Obtener sesión abierta
    const [sesionAbierta] = await db
      .select()
      .from(cajaSesion)
      .where(eq(cajaSesion.estado, 'ABIERTA'))
      .limit(1)

    if (!sesionAbierta) {
      return {
        success: false,
        error: 'No hay sesión de caja abierta'
      }
    }

    // 2. Obtener movimientos de la sesión
    const movimientos = await db
      .select()
      .from(movimientoCaja)
      .where(eq(movimientoCaja.cajaSesionId, sesionAbierta.id))

    // 3. Calcular ingresos de efectivo físico
    const ingresosEfectivo = movimientos
      .filter(
        m =>
          m.tipo === 'INGRESO' &&
          ['CAPITAL_INICIAL', 'PAGO_EFECTIVO', 'INYECCION_EFECTIVO'].includes(
            m.categoria
          )
      )
      .reduce((sum, m) => sum + Number(m.monto), 0)

    // 4. Calcular egresos de efectivo físico
    const egresosEfectivo = movimientos
      .filter(
        m =>
          m.tipo === 'EGRESO' &&
          ['DESEMBOLSO', 'RETIRO_EFECTIVO'].includes(m.categoria)
      )
      .reduce((sum, m) => sum + Number(m.monto), 0)

    // 5. Calcular efectivo disponible
    const efectivoDisponible =
      Number(sesionAbierta.saldoInicial) + ingresosEfectivo - egresosEfectivo

    return {
      success: true,
      efectivoDisponible
    }
  } catch (error) {
    console.error('Error calculando efectivo disponible:', error)
    return {
      success: false,
      error: 'Error al calcular efectivo disponible'
    }
  }
}
