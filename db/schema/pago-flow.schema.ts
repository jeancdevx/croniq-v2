import { decimal, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

/**
 * Tabla: pago_flow
 * Almacena las transacciones generadas a través de la pasarela de pagos Flow.cl
 */
export const pagoFlow = pgTable('pago_flow', {
  id: uuid('id').defaultRandom().primaryKey(),
  flowOrder: varchar('flow_order', { length: 100 }).notNull().unique(),
  flowToken: varchar('flow_token', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  monto: decimal('monto', { precision: 12, scale: 2 }).notNull(),
  concepto: varchar('concepto', { length: 255 }).notNull(),
  estado: varchar('estado', { length: 20 }).default('PENDIENTE').notNull(), // PENDIENTE, PAGADO, RECHAZADO
  fechaCreacion: timestamp('fecha_creacion', { withTimezone: true })
    .defaultNow()
    .notNull(),
  fechaPago: timestamp('fecha_pago', { withTimezone: true }),
  currency: varchar('currency', { length: 10 }).default('PEN').notNull()
})
