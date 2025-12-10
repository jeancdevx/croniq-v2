'use server'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cajaSesion, movimientoCaja } from '@/db/schema'

/**
 * Obtiene la sesión de caja actualmente abierta con su resumen
 */
export async function getSesionActual() {
  const db = getDb()
  if (!db) return { success: false, error: 'No database connection' }

  try {
    // 1. Buscar sesión abierta
    const [sesionAbierta] = await db
      .select()
      .from(cajaSesion)
      .where(eq(cajaSesion.estado, 'ABIERTA'))
      .limit(1)

    if (!sesionAbierta) {
      return {
        success: true,
        sesionAbierta: false,
        sesion: null
      }
    }

    // 2. Obtener movimientos de la sesión
    const movimientos = await db
      .select()
      .from(movimientoCaja)
      .where(eq(movimientoCaja.cajaSesionId, sesionAbierta.id))

    // 3. Calcular totales
    const ingresos = movimientos
      .filter(m => m.tipo === 'INGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0)

    const egresos = movimientos
      .filter(m => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0)

    const saldoTeorico = Number(sesionAbierta.saldoInicial) + ingresos - egresos

    // 4. Desglosar ingresos por categoría
    const ingresosEfectivo = movimientos
      .filter(m => m.tipo === 'INGRESO' && m.categoria === 'PAGO_EFECTIVO')
      .reduce((sum, m) => sum + Number(m.monto), 0)

    const ingresosFlow = movimientos
      .filter(m => m.tipo === 'INGRESO' && m.categoria === 'PAGO_FLOW')
      .reduce((sum, m) => sum + Number(m.monto), 0)

    const comisionesFlow = movimientos
      .filter(m => m.tipo === 'INGRESO' && m.categoria === 'PAGO_FLOW')
      .reduce((sum, m) => sum + Number(m.comisionFlow || '0'), 0)

    return {
      success: true,
      sesionAbierta: true,
      sesion: sesionAbierta,
      resumen: {
        saldoInicial: Number(sesionAbierta.saldoInicial),
        totalIngresos: ingresos,
        totalEgresos: egresos,
        saldoTeorico,
        cantidadMovimientos: movimientos.length,
        desglose: {
          ingresosEfectivo,
          ingresosFlow,
          comisionesFlow
        }
      },
      movimientos
    }
  } catch (error) {
    console.error('Error obteniendo sesión actual:', error)
    return { success: false, error: 'Error al obtener sesión actual' }
  }
}
