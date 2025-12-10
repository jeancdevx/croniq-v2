'use server'

import { and, desc, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cajaSesion } from '@/db/schema'

/**
 * Obtiene el historial de sesiones cerradas
 * @param limit - Cantidad de sesiones a obtener
 * @param offset - Offset para paginación
 */
export async function getHistorialSesiones(limit = 20, offset = 0) {
  const db = getDb()
  if (!db) return { success: false, error: 'No database connection' }

  try {
    const sesiones = await db
      .select()
      .from(cajaSesion)
      .where(eq(cajaSesion.estado, 'CERRADA'))
      .orderBy(desc(cajaSesion.numeroSesion))
      .limit(limit)
      .offset(offset)

    return {
      success: true,
      sesiones
    }
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    return { success: false, error: 'Error al obtener historial' }
  }
}
