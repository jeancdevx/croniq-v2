import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

/**
 * Tabla: caja_sesion
 * Almacena las sesiones de caja (apertura y cierre)
 * Permite múltiples sesiones por día
 */
export const cajaSesion = pgTable('caja_sesion', {
  id: uuid('id').defaultRandom().primaryKey(),
  numeroSesion: integer('numero_sesion').notNull(), // 0 = capital inicial, 1+ = sesiones reales
  fecha: timestamp('fecha', { withTimezone: true }).notNull(),

  // Apertura
  fechaApertura: timestamp('fecha_apertura', { withTimezone: true }).notNull(),
  saldoInicial: decimal('saldo_inicial', { precision: 12, scale: 2 }).notNull(),

  // Cierre
  fechaCierre: timestamp('fecha_cierre', { withTimezone: true }),
  saldoFinalTeorico: decimal('saldo_final_teorico', {
    precision: 12,
    scale: 2
  }),
  saldoFinalReal: decimal('saldo_final_real', { precision: 12, scale: 2 }),
  diferencia: decimal('diferencia', { precision: 12, scale: 2 }), // real - teorico

  estado: varchar('estado', { length: 20 }).notNull(), // 'ABIERTA' | 'CERRADA'
  observaciones: text('observaciones'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
