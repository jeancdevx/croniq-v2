import {
  date,
  decimal,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

import { cliente } from './cliente.schema'

export const prestamo = pgTable('prestamo', {
  id: uuid('id').defaultRandom().primaryKey(),
  clienteId: uuid('cliente_id')
    .notNull()
    .references(() => cliente.id, { onDelete: 'restrict' }),
  montoSolicitado: decimal('monto_solicitado', {
    precision: 12,
    scale: 2
  }).notNull(),
  tasaInteres: decimal('tasa_interes', { precision: 5, scale: 4 }).notNull(),
  numeroCuotas: integer('numero_cuotas').notNull(),
  frecuencia: varchar('frecuencia', { length: 20 })
    .default('MENSUAL')
    .notNull(),
  moneda: varchar('moneda', { length: 3 }).default('PEN').notNull(),
  tipoCambioOriginal: decimal('tipo_cambio_original', {
    precision: 6,
    scale: 4
  }),
  fechaDesembolso: date('fecha_desembolso').notNull(),
  estado: varchar('estado', { length: 20 }).default('ACTIVO').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
