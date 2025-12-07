import {
  decimal,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

/**
 * Tabla: movimientos
 * Registro de caja para control de ingresos y egresos
 */
export const movimientos = pgTable('movimientos', {
  id: uuid('id').defaultRandom().primaryKey(),
  fechaMovimiento: timestamp('fecha_movimiento', {
    withTimezone: true
  }).notNull(),
  tipoMovimiento: varchar('tipo_movimiento', { length: 20 }).notNull(),
  concepto: text('concepto').notNull(),
  monto: decimal('monto', { precision: 12, scale: 2 }).notNull(),
  moneda: varchar('moneda', { length: 3 }).default('PEN').notNull(),
  origenReferencia: varchar('origen_referencia', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
