'use server'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cajaSesion, movimientoCaja } from '@/db/schema'

import type { MedioPagoFlow } from '../lib/calcular-comision-flow'
import type { CategoriaMovimiento, TipoMovimiento } from '../types'

interface CrearMovimientoParams {
  tipo: TipoMovimiento
  categoria: CategoriaMovimiento
  monto: number
  descripcion?: string

  // Opcionales para Flow
  montoBruto?: number
  comisionFlow?: number
  medioPagoFlow?: MedioPagoFlow

  // Referencias opcionales
  pagoId?: string
  pagoFlowId?: string
  prestamoId?: string
}

/**
 * Crea un movimiento de caja asociado a la sesión actualmente abierta
 * @param params - Parámetros del movimiento
 */
export async function crearMovimientoCaja(params: CrearMovimientoParams) {
  const db = getDb()
  if (!db) return { success: false, error: 'No database connection' }

  try {
    // 1. Verificar que haya sesión abierta
    const [sesionAbierta] = await db
      .select()
      .from(cajaSesion)
      .where(eq(cajaSesion.estado, 'ABIERTA'))
      .limit(1)

    if (!sesionAbierta) {
      console.warn('⚠️ Intento de crear movimiento sin sesión abierta')
      return {
        success: false,
        error: 'No hay sesión de caja abierta. Abra caja primero.'
      }
    }

    // 2. Crear movimiento
    const [movimiento] = await db
      .insert(movimientoCaja)
      .values({
        cajaSesionId: sesionAbierta.id,
        tipo: params.tipo,
        categoria: params.categoria,
        monto: params.monto.toString(),
        montoBruto: params.montoBruto?.toString(),
        comisionFlow: params.comisionFlow?.toString(),
        medioPagoFlow: params.medioPagoFlow,
        pagoId: params.pagoId,
        pagoFlowId: params.pagoFlowId,
        prestamoId: params.prestamoId,
        descripcion: params.descripcion,
        fechaMovimiento: new Date()
      })
      .returning()

    console.log(
      `✅ Movimiento creado: ${params.tipo} - ${params.categoria} - S/ ${params.monto}`
    )

    return {
      success: true,
      movimiento
    }
  } catch (error) {
    console.error('Error creando movimiento:', error)
    return { success: false, error: 'Error al crear movimiento' }
  }
}
