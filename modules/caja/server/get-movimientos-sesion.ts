'use server'

import { asc, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { movimientoCaja } from '@/db/schema'

/**
 * Obtiene los movimientos de una sesión específica
 * @param cajaSesionId - ID de la sesión
 */
export async function getMovimientosSesion(cajaSesionId: string) {
  const db = getDb()
  if (!db) return { success: false, error: 'No database connection' }

  try {
    const movimientos = await db
      .select()
      .from(movimientoCaja)
      .where(eq(movimientoCaja.cajaSesionId, cajaSesionId))
      .orderBy(asc(movimientoCaja.fechaMovimiento))

    return {
      success: true,
      movimientos
    }
  } catch (error) {
    console.error('Error obteniendo movimientos:', error)
    return { success: false, error: 'Error al obtener movimientos' }
  }
}
