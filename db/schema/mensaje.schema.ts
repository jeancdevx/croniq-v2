import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

import { cliente } from './cliente.schema'

export const mensaje = pgTable('mensaje', {
  id: uuid('id').defaultRandom().primaryKey(),
  clienteId: uuid('cliente_id').references(() => cliente.id),
  destinatario: varchar('destinatario', { length: 255 }).notNull(),
  telefono: varchar('telefono', { length: 20 }).notNull(),
  tipo: varchar('tipo', { length: 50 }).notNull(), // RECORDATORIO, COMPROBANTE, CRONOGRAMA
  contenido: text('contenido'),
  estado: varchar('estado', { length: 20 }).notNull(), // ENVIADO, FALLIDO
  fechaEnvio: timestamp('fecha_envio', { withTimezone: true })
    .defaultNow()
    .notNull(),
  metadata: jsonb('metadata')
})
