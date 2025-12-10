'use server'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cuota } from '@/db/schema'

import { evaluateCuotaLateFee } from '../lib/late-fees'

interface EvaluateResult {
  success: boolean
  data?: {
    cuotasActualizadas: number
    cuotasVencidas: number
    totalMoras: number
  }
  error?: string
}

/**
 * Evalúa y actualiza las moras de todas las cuotas de un préstamo
 *
 * Se ejecuta:
 * - Al visualizar el detalle del préstamo
 * - Antes de aplicar un pago
 * - En un cron job diario (opcional)
 */
export const evaluateLateFees = async (
  prestamoId: string
): Promise<EvaluateResult> => {
  try {
    const db = getDb()

    // 1. Obtener todas las cuotas del préstamo
    const cuotas = await db
      .select()
      .from(cuota)
      .where(eq(cuota.prestamoId, prestamoId))
      .orderBy(cuota.numeroCuota)

    if (cuotas.length === 0) {
      return { success: false, error: 'No se encontraron cuotas' }
    }

    let cuotasActualizadas = 0
    let cuotasVencidas = 0
    let totalMoras = 0

    // 2. Evaluar cada cuota
    for (const c of cuotas) {
      // Saltar cuotas ya pagadas
      if (c.estado === 'PAGADO') continue

      const evaluacion = evaluateCuotaLateFee({
        fechaVencimiento: c.fechaVencimiento,
        totalConSeguro: c.totalConSeguro,
        montoPagado: c.montoPagado,
        estado: c.estado
      })

      // 3. Actualizar si hay cambios
      const moraActual = parseFloat(c.montoMora)
      const diasActual = c.diasMora

      if (
        evaluacion.montoMora !== moraActual ||
        evaluacion.diasMora !== diasActual ||
        evaluacion.estado !== c.estado
      ) {
        await db
          .update(cuota)
          .set({
            montoMora: evaluacion.montoMora.toString(),
            diasMora: evaluacion.diasMora,
            estado: evaluacion.estado
          })
          .where(eq(cuota.id, c.id))

        cuotasActualizadas++
      }

      if (evaluacion.estado === 'VENCIDO') {
        cuotasVencidas++
        totalMoras += evaluacion.montoMora
      }
    }

    return {
      success: true,
      data: {
        cuotasActualizadas,
        cuotasVencidas,
        totalMoras: Math.round(totalMoras * 100) / 100
      }
    }
  } catch (error) {
    console.error('Error evaluando moras:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
