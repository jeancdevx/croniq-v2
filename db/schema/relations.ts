import { relations } from 'drizzle-orm'

import { cliente } from './cliente.schema'
import { cuota } from './cuota.schema'
import { prestamo } from './prestamo.schema'

export const clienteRelations = relations(cliente, ({ many }) => ({
  prestamos: many(prestamo)
}))

export const prestamoRelations = relations(prestamo, ({ one, many }) => ({
  cliente: one(cliente, {
    fields: [prestamo.clienteId],
    references: [cliente.id]
  }),
  cuotas: many(cuota)
}))

export const cuotaRelations = relations(cuota, ({ one }) => ({
  prestamo: one(prestamo, {
    fields: [cuota.prestamoId],
    references: [prestamo.id]
  })
}))
