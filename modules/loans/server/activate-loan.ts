'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { prestamo } from '@/db/schema'

import { hasActiveLoan } from './validate-loan-rules'

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

    // Verificar que el cliente no tenga otro préstamo ACTIVO
    const hasActive = await hasActiveLoan(existingLoan.clienteId)
    if (hasActive) {
      return {
        success: false,
        error:
          'El cliente ya tiene un préstamo activo. No se puede activar otro préstamo.'
      }
    }

    // Validar que haya sesión de caja abierta
    const { getSesionActual, calcularEfectivoDisponible } =
      await import('@/modules/caja/server')
    const sesionResult = await getSesionActual()

    if (!sesionResult.success || !sesionResult.sesionAbierta) {
      return {
        success: false,
        error:
          'No hay sesión de caja abierta. Debes abrir caja antes de desembolsar préstamos.'
      }
    }

    // Validar que haya suficiente efectivo disponible
    const efectivoResult = await calcularEfectivoDisponible()
    const montoDesembolso = Number(existingLoan.montoDesembolsado)

    if (!efectivoResult.success) {
      return {
        success: false,
        error: 'Error al verificar efectivo disponible en caja'
      }
    }

    const efectivoDisponible = efectivoResult.efectivoDisponible || 0

    if (efectivoDisponible < montoDesembolso) {
      return {
        success: false,
        error: `Efectivo insuficiente en caja. Disponible: S/ ${efectivoDisponible.toFixed(2)}, Necesario: S/ ${montoDesembolso.toFixed(2)}. Debes inyectar S/ ${(montoDesembolso - efectivoDisponible).toFixed(2)} adicionales.`
      }
    }

    // Cambiar estado a ACTIVO
    await db
      .update(prestamo)
      .set({ estado: 'ACTIVO' })
      .where(eq(prestamo.id, loanId))

    // Enviar cronograma automáticamente por WhatsApp
    try {
      const { sendScheduleWhatsApp } = await import('./send-schedule-whatsapp')
      const sendResult = await sendScheduleWhatsApp(loanId)

      if (!sendResult.success) {
        console.warn('Failed to send schedule automatically:', sendResult.error)
        // No fallar la activación, solo loguear
      }
    } catch (error) {
      console.error('Error sending schedule automatically:', error)
      // No fallar la activación
    }

    // Crear movimiento de caja (egreso por desembolso)
    try {
      const { crearMovimientoCaja } = await import('@/modules/caja/server')

      await crearMovimientoCaja({
        tipo: 'EGRESO',
        categoria: 'DESEMBOLSO',
        monto: montoDesembolso,
        prestamoId: loanId,
        descripcion: `Desembolso préstamo - S/ ${montoDesembolso.toFixed(2)}`
      })

      console.log(`✅ Movimiento caja: Desembolso S/ ${montoDesembolso}`)
    } catch (cajaError) {
      console.warn('⚠️ No se pudo registrar movimiento de caja:', cajaError)
      // No fallar la activación si falla el registro de caja
    }

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
