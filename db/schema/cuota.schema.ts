import {
  date,
  decimal,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

import { prestamo } from './prestamo.schema'

export const cuota = pgTable(
  'cuota',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    prestamoId: uuid('prestamo_id')
      .notNull()
      .references(() => prestamo.id, { onDelete: 'cascade' }),
    numeroCuota: integer('numero_cuota').notNull(),
    fechaVencimiento: date('fecha_vencimiento').notNull(),
    totalCuota: decimal('total_cuota', { precision: 12, scale: 2 }).notNull(),
    capital: decimal('capital', { precision: 12, scale: 2 }).notNull(),
    interes: decimal('interes', { precision: 12, scale: 2 }).notNull(),
    saldoRestante: decimal('saldo_restante', {
      precision: 12,
      scale: 2
    }).notNull(),
    estado: varchar('estado', { length: 20 }).default('PENDIENTE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  table => ({
    uniquePrestamoNumeroCuota: unique().on(table.prestamoId, table.numeroCuota)
  })
)
