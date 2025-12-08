import { decimal, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { cuota } from './cuota.schema'

export const pago = pgTable('pago', {
  id: uuid('id').defaultRandom().primaryKey(),
  cuotaId: uuid('cuota_id')
    .notNull()
    .unique()
    .references(() => cuota.id, { onDelete: 'restrict' }),
  fechaPago: timestamp('fecha_pago', { withTimezone: true }).notNull(),
  montoTotalRecibido: decimal('monto_total_recibido', {
    precision: 12,
    scale: 2
  }).notNull(),
  moraCobrada: decimal('mora_cobrada', { precision: 12, scale: 2 })
    .default('0')
    .notNull(),
  interesCobrado: decimal('interes_cobrado', {
    precision: 12,
    scale: 2
  }).notNull(),
  capitalCobrado: decimal('capital_cobrado', {
    precision: 12,
    scale: 2
  }).notNull(),
  medioPago: varchar('medio_pago', { length: 30 }).notNull(),
  codigoOperacion: varchar('codigo_operacion', { length: 50 }),
  numeroRecibo: varchar('numero_recibo', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
