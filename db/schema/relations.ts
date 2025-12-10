import { relations } from 'drizzle-orm'

import { cliente } from './cliente.schema'
import { cuota } from './cuota.schema'
import { mensaje } from './mensaje.schema'
import { pagoFlow } from './pago-flow.schema'
import { pago } from './pago.schema'
import { prestamo } from './prestamo.schema'

export const clienteRelations = relations(cliente, ({ many }) => ({
  prestamos: many(prestamo),
  mensajes: many(mensaje)
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
  }),
  pago: one(pago, {
    fields: [cuota.id],
    references: [pago.cuotaId]
  })
}))

export const pagoRelations = relations(pago, ({ one }) => ({
  cuota: one(cuota, {
    fields: [pago.cuotaId],
    references: [cuota.id]
  }),
  pagoFlow: one(pagoFlow, {
    fields: [pago.pagoFlowId],
    references: [pagoFlow.id]
  })
}))

export const pagoFlowRelations = relations(pagoFlow, ({ one }) => ({
  pago: one(pago, {
    fields: [pagoFlow.id],
    references: [pago.pagoFlowId]
  })
}))

export const mensajeRelations = relations(mensaje, ({ one }) => ({
  cliente: one(cliente, {
    fields: [mensaje.clienteId],
    references: [cliente.id]
  })
}))
