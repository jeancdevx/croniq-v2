import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const cliente = pgTable('cliente', {
  id: uuid('id').defaultRandom().primaryKey(),
  dni: varchar('dni', { length: 20 }).notNull().unique(),
  nombres: varchar('nombres', { length: 100 }).notNull(),
  apellidos: varchar('apellidos', { length: 100 }).notNull(),
  direccion: text('direccion'),
  telefono: varchar('telefono', { length: 20 }).notNull(),
  email: varchar('email', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
