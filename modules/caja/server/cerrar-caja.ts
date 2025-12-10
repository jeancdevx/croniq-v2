'use server'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cajaSesion, movimientoCaja } from '@/db/schema'

/**
 * Cierra la sesión de caja actualmente abierta
 * @param saldoReal - Saldo real contado/consultado en cuenta bancaria
 * @param observaciones - Observaciones del cierre (obligatorio si hay diferencia)
 * @param retirarEfectivo - Monto a retirar de la caja (opcional, para vaciar caja)
 */
export async function cerrarCaja(
  saldoReal: number,
  observaciones?: string,
  retirarEfectivo?: number
) {
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
      return { success: false, error: 'No hay sesión abierta para cerrar' }
    }

    // 2. Calcular saldo teórico
    const movimientos = await db
      .select()
      .from(movimientoCaja)
      .where(eq(movimientoCaja.cajaSesionId, sesionAbierta.id))

    const ingresos = movimientos
      .filter(m => m.tipo === 'INGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0)

    const egresos = movimientos
      .filter(m => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0)

    let saldoTeorico = Number(sesionAbierta.saldoInicial) + ingresos - egresos

    // 3. Registrar retiro de efectivo si se especifica
    if (retirarEfectivo && retirarEfectivo > 0) {
      await db.insert(movimientoCaja).values({
        cajaSesionId: sesionAbierta.id,
        tipo: 'EGRESO',
        categoria: 'RETIRO_EFECTIVO',
        monto: retirarEfectivo.toString(),
        descripcion: 'Retiro de efectivo al cierre de caja',
        fechaMovimiento: new Date()
      })

      // Recalcular saldo teórico después del retiro
      saldoTeorico -= retirarEfectivo

      console.log(
        `💰 Retiro de efectivo: S/ ${retirarEfectivo.toFixed(2)} - Nuevo saldo teórico: S/ ${saldoTeorico.toFixed(2)}`
      )
    }

    const diferencia = saldoReal - saldoTeorico

    // 4. Validar observaciones si hay diferencia
    if (Math.abs(diferencia) > 0.01 && !observaciones) {
      return {
        success: false,
        error: `Hay una diferencia de S/ ${diferencia.toFixed(2)}. Debe ingresar observaciones.`,
        diferencia
      }
    }

    // 5. Cerrar sesión
    const [sesionCerrada] = await db
      .update(cajaSesion)
      .set({
        fechaCierre: new Date(),
        saldoFinalTeorico: saldoTeorico.toFixed(2),
        saldoFinalReal: saldoReal.toFixed(2),
        diferencia: diferencia.toFixed(2),
        estado: 'CERRADA',
        observaciones,
        updatedAt: new Date()
      })
      .where(eq(cajaSesion.id, sesionAbierta.id))
      .returning()

    console.log(
      `✅ Caja cerrada - Sesión #${sesionCerrada.numeroSesion} - Diferencia: S/ ${diferencia.toFixed(2)}${retirarEfectivo ? ` - Retiro: S/ ${retirarEfectivo.toFixed(2)}` : ''}`
    )

    return {
      success: true,
      sesion: sesionCerrada,
      saldoTeorico,
      saldoReal,
      diferencia,
      tieneDiferencia: Math.abs(diferencia) > 0.01,
      retirarEfectivo: retirarEfectivo || 0
    }
  } catch (error) {
    console.error('Error cerrando caja:', error)
    return { success: false, error: 'Error al cerrar caja' }
  }
}
