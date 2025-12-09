import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

/**
 * Tabla: comprobante_numeracion
 * Control de numeración correlativa por tipo de comprobante y serie
 */
export const comprobanteNumeracion = pgTable('comprobante_numeracion', {
  id: uuid('id').defaultRandom().primaryKey(),
  tipoComprobante: varchar('tipo_comprobante', { length: 20 }).notNull(), // "BOLETA", "FACTURA"
  serie: varchar('serie', { length: 4 }).notNull(), // "B001", "F001"
  ultimoNumero: integer('ultimo_numero').default(0).notNull(),
  puntoEmision: varchar('punto_emision', { length: 50 })
    .default('PRINCIPAL')
    .notNull(),
  activo: boolean('activo').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
