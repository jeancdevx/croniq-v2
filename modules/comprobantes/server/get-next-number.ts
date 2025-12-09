'use server'

import { and, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { comprobanteNumeracion } from '@/db/schema'

/**
 * Obtiene el siguiente número de comprobante y actualiza el contador
 * Usa FOR UPDATE para evitar duplicados en concurrencia
 */
export async function getNextComprobanteNumber(
  tipoComprobante: 'BOLETA' | 'FACTURA',
  serie: string
): Promise<{ serie: string; numero: string; numeroCompleto: string }> {
  const db = getDb()
  if (!db) throw new Error('No database connection')

  try {
    // 1. Obtener y bloquear el registro (FOR UPDATE)
    const [numeracion] = await db
      .select()
      .from(comprobanteNumeracion)
      .where(
        and(
          eq(comprobanteNumeracion.tipoComprobante, tipoComprobante),
          eq(comprobanteNumeracion.serie, serie),
          eq(comprobanteNumeracion.activo, true)
        )
      )
      .for('update')

    if (!numeracion) {
      throw new Error(`Serie ${serie} no encontrada o inactiva`)
    }

    // 2. Incrementar número
    const nuevoNumero = numeracion.ultimoNumero + 1

    // 3. Actualizar en BD
    await db
      .update(comprobanteNumeracion)
      .set({
        ultimoNumero: nuevoNumero,
        updatedAt: new Date()
      })
      .where(eq(comprobanteNumeracion.id, numeracion.id))

    // 4. Formatear número
    const numeroFormateado = String(nuevoNumero).padStart(8, '0')
    const numeroCompleto = `${serie}-${numeroFormateado}`

    return {
      serie,
      numero: numeroFormateado,
      numeroCompleto
    }
  } catch (error) {
    console.error('Error getting next comprobante number:', error)
    throw error
  }
}
