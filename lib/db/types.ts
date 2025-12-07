import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import * as schema from './schema'

/**
 * Tipos TypeScript inferidos de los schemas de Drizzle
 */

// ============================================================================
// CLIENTE
// ============================================================================
export type Cliente = InferSelectModel<typeof schema.cliente>
export type NewCliente = InferInsertModel<typeof schema.cliente>

// ============================================================================
// PRESTAMO
// ============================================================================
export type Prestamo = InferSelectModel<typeof schema.prestamo>
export type NewPrestamo = InferInsertModel<typeof schema.prestamo>

// Estados del préstamo
export type EstadoPrestamo = 'ACTIVO' | 'FINALIZADO' | 'ANULADO'

// ============================================================================
// CUOTA
// ============================================================================
export type Cuota = InferSelectModel<typeof schema.cuota>
export type NewCuota = InferInsertModel<typeof schema.cuota>

// Estados de la cuota
export type EstadoCuota = 'PENDIENTE' | 'PAGADO' | 'VENCIDO'

// ============================================================================
// PAGO
// ============================================================================
export type Pago = InferSelectModel<typeof schema.pago>
export type NewPago = InferInsertModel<typeof schema.pago>

// Medios de pago
export type MedioPago = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA'

// ============================================================================
// MOVIMIENTOS
// ============================================================================
export type Movimiento = InferSelectModel<typeof schema.movimientos>
export type NewMovimiento = InferInsertModel<typeof schema.movimientos>

// Tipos de movimiento
export type TipoMovimiento = 'INGRESO' | 'EGRESO'

// ============================================================================
// TIPOS COMPUESTOS
// ============================================================================

/**
 * Cliente con sus préstamos
 */
export type ClienteConPrestamos = Cliente & {
  prestamos: Prestamo[]
}

/**
 * Préstamo con sus cuotas
 */
export type PrestamoConCuotas = Prestamo & {
  cuotas: Cuota[]
  cliente: Cliente
}

/**
 * Cuota con su pago (si existe)
 */
export type CuotaConPago = Cuota & {
  pago: Pago | null
}

/**
 * Préstamo completo con toda la información relacionada
 */
export type PrestamoCompleto = Prestamo & {
  cliente: Cliente
  cuotas: CuotaConPago[]
}
