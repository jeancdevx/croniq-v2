import { decimal, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { prestamo } from './prestamo.schema'

/**
 * Tabla: pago_flow
 * Almacena las transacciones generadas a través de la pasarela de pagos Flow.cl
 */
export const pagoFlow = pgTable('pago_flow', {
  id: uuid('id').defaultRandom().primaryKey(),
  flowOrder: varchar('flow_order', { length: 100 }).notNull().unique(),
  flowToken: varchar('flow_token', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  monto: decimal('monto', { precision: 12, scale: 2 }).notNull(), // Monto total con comisión
  montoBase: decimal('monto_base', { precision: 12, scale: 2 }), // Monto real a descontar del préstamo
  concepto: varchar('concepto', { length: 255 }).notNull(),
  prestamoId: uuid('prestamo_id').references(() => prestamo.id),
  estado: varchar('estado', { length: 20 }).default('PENDIENTE').notNull(), // PENDIENTE, PAGADO, RECHAZADO
  fechaCreacion: timestamp('fecha_creacion', { withTimezone: true })
    .defaultNow()
    .notNull(),
  fechaPago: timestamp('fecha_pago', { withTimezone: true }),
  currency: varchar('currency', { length: 10 }).default('PEN').notNull(),
  medioPago: varchar('medio_pago', { length: 50 }) // Webpay, Servipag, etc.
})
