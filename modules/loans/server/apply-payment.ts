'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cuota } from '@/db/schema'

import { distributePayment, type CuotaConMora } from '../lib/late-fees'
import { evaluateLateFees } from './evaluate-late-fees'

interface ApplyPaymentResult {
  success: boolean
  data?: {
    cuotasAfectadas: Array<{
      numeroCuota: number
      moraAplicada: number
      capitalAplicado: number
      saldoRestante: number
      estadoFinal: string
    }>
    totalMorasPagadas: number
    totalCapitalPagado: number
    montoSobrante: number
  }
  error?: string
}

/**
 * Aplica un pago a las cuotas de un préstamo
 *
 * Orden de aplicación:
 * 1. Mora de cuota más antigua
 * 2. Saldo de cuota más antigua
 * 3. Siguiente cuota...
 *
 * @param prestamoId - ID del préstamo
 * @param montoPago - Monto a aplicar
 */
export const applyPayment = async (
  prestamoId: string,
  montoPago: number
): Promise<ApplyPaymentResult> => {
  try {
    const db = getDb()

    // 1. Primero evaluar moras actuales
    await evaluateLateFees(prestamoId)

    // 2. Obtener cuotas pendientes ordenadas por antigüedad
    const cuotas = await db
      .select()
      .from(cuota)
      .where(eq(cuota.prestamoId, prestamoId))
      .orderBy(cuota.numeroCuota)

    // Filtrar solo cuotas con saldo pendiente
    const cuotasPendientes: CuotaConMora[] = cuotas
      .filter(c => c.estado !== 'PAGADO')
      .map(c => ({
        id: c.id,
        numeroCuota: c.numeroCuota,
        fechaVencimiento: c.fechaVencimiento,
        totalConSeguro: parseFloat(c.totalConSeguro),
        saldoPendiente:
          parseFloat(c.totalConSeguro) - parseFloat(c.montoPagado),
        montoMora: parseFloat(c.montoMora),
        estado: c.estado
      }))

    if (cuotasPendientes.length === 0) {
      return {
        success: false,
        error: 'No hay cuotas pendientes de pago'
      }
    }

    // 3. Distribuir el pago
    const resultado = distributePayment(cuotasPendientes, montoPago)

    // 4. Actualizar cuotas en la base de datos
    for (const actualizacion of resultado.cuotasActualizadas) {
      const cuotaOriginal = cuotasPendientes.find(
        c => c.numeroCuota === actualizacion.numeroCuota
      )
      if (!cuotaOriginal) continue

      const nuevoMontoPagado =
        parseFloat(
          cuotas.find(c => c.numeroCuota === actualizacion.numeroCuota)
            ?.montoPagado || '0'
        ) + actualizacion.capitalAplicado

      const nuevaMora = cuotaOriginal.montoMora - actualizacion.moraAplicada

      await db
        .update(cuota)
        .set({
          montoPagado: nuevoMontoPagado.toFixed(2),
          saldoPendiente: actualizacion.saldoRestante.toFixed(2),
          montoMora: nuevaMora.toFixed(2),
          estado: actualizacion.estadoFinal,
          fechaPago:
            actualizacion.estadoFinal === 'PAGADO' ? new Date() : undefined
        })
        .where(eq(cuota.id, cuotaOriginal.id))
    }

    // 5. Revalidar rutas
    revalidatePath(`/loans/${prestamoId}`)
    revalidatePath('/loans')

    return {
      success: true,
      data: {
        cuotasAfectadas: resultado.cuotasActualizadas,
        totalMorasPagadas: resultado.totalMorasPagadas,
        totalCapitalPagado: resultado.totalCapitalPagado,
        montoSobrante: resultado.montoSobrante
      }
    }
  } catch (error) {
    console.error('Error aplicando pago:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
