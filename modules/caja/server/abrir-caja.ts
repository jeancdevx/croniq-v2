'use server'

import { desc, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cajaSesion } from '@/db/schema'

/**
 * Abre una nueva sesión de caja
 * El saldo inicial se hereda automáticamente del saldo final de la sesión anterior
 * @param observaciones - Observaciones opcionales de apertura
 */
export async function abrirCaja(observaciones?: string) {
  const db = getDb()
  if (!db) return { success: false, error: 'No database connection' }

  try {
    // 1. Verificar que no haya sesión abierta
    const [sesionAbierta] = await db
      .select()
      .from(cajaSesion)
      .where(eq(cajaSesion.estado, 'ABIERTA'))
      .limit(1)

    if (sesionAbierta) {
      return {
        success: false,
        error: `Ya existe una sesión abierta (#${sesionAbierta.numeroSesion}). Ciérrela primero.`
      }
    }

    // 2. Obtener última sesión cerrada para heredar saldo
    const [ultimaSesion] = await db
      .select()
      .from(cajaSesion)
      .orderBy(desc(cajaSesion.numeroSesion))
      .limit(1)

    // Saldo inicial = saldo final de sesión anterior (o 0 si es la primera)
    const saldoInicial = ultimaSesion?.saldoFinalReal
      ? Number(ultimaSesion.saldoFinalReal)
      : 0

    const nuevoNumero = ultimaSesion ? ultimaSesion.numeroSesion + 1 : 1

    // 3. Crear nueva sesión
    const now = new Date()
    const [nuevaSesion] = await db
      .insert(cajaSesion)
      .values({
        numeroSesion: nuevoNumero,
        fecha: now,
        fechaApertura: now,
        saldoInicial: saldoInicial.toString(),
        estado: 'ABIERTA',
        observaciones
      })
      .returning()

    console.log(
      `✅ Caja abierta - Sesión #${nuevoNumero} - Saldo inicial: S/ ${saldoInicial} (heredado)`
    )

    return {
      success: true,
      sesion: nuevaSesion,
      saldoInicial
    }
  } catch (error) {
    console.error('Error abriendo caja:', error)
    return { success: false, error: 'Error al abrir caja' }
  }
}
