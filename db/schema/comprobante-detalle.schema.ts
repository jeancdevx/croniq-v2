import {
  decimal,
  integer,
  pgTable,
  text,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

import { comprobante } from './comprobante.schema'
import { cuota } from './cuota.schema'

/**
 * Tabla: comprobante_detalle
 * Detalle de cuotas pagadas en un comprobante
 * Un comprobante puede tener múltiples detalles (una línea por cuota afectada)
 */
export const comprobanteDetalle = pgTable('comprobante_detalle', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Relaciones
  comprobanteId: uuid('comprobante_id')
    .notNull()
    .references(() => comprobante.id, { onDelete: 'cascade' }),
  cuotaId: uuid('cuota_id')
    .notNull()
    .references(() => cuota.id, { onDelete: 'restrict' }),

  // Datos de la cuota
  numeroCuota: integer('numero_cuota').notNull(),
  montoPagado: decimal('monto_pagado', { precision: 12, scale: 2 }).notNull(),

  // Estado de la cuota después del pago
  estadoCuota: varchar('estado_cuota', { length: 20 }).notNull(), // "COMPLETA", "PARCIAL"
  saldoRestante: decimal('saldo_restante', { precision: 12, scale: 2 }), // Solo si es parcial

  // Descripción para el PDF
  descripcion: text('descripcion'), // "Cuota 1 - Completa" o "Cuota 6 - Parcial (Saldo: S/ 500.00)"

  // Orden de aparición en el comprobante
  orden: integer('orden').notNull()
})
