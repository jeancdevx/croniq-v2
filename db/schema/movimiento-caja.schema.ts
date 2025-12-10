import {
  decimal,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

import { cajaSesion } from './caja-sesion.schema'
import { pagoFlow } from './pago-flow.schema'
import { pago } from './pago.schema'
import { prestamo } from './prestamo.schema'

/**
 * Tabla: movimiento_caja
 * Registra todos los movimientos de dinero (ingresos y egresos)
 * asociados a una sesión de caja
 */
export const movimientoCaja = pgTable('movimiento_caja', {
  id: uuid('id').defaultRandom().primaryKey(),
  cajaSesionId: uuid('caja_sesion_id')
    .notNull()
    .references(() => cajaSesion.id, { onDelete: 'restrict' }),

  tipo: varchar('tipo', { length: 20 }).notNull(), // 'INGRESO' | 'EGRESO'
  categoria: varchar('categoria', { length: 50 }).notNull(),
  // 'CAPITAL_INICIAL' | 'PAGO_EFECTIVO' | 'PAGO_FLOW' | 'DESEMBOLSO'

  monto: decimal('monto', { precision: 12, scale: 2 }).notNull(), // Monto neto (después de comisiones)

  // Para pagos Flow: registrar comisión
  montoBruto: decimal('monto_bruto', { precision: 12, scale: 2 }), // Monto antes de comisión
  comisionFlow: decimal('comision_flow', { precision: 12, scale: 2 }), // Comisión total
  medioPagoFlow: varchar('medio_pago_flow', { length: 20 }), // 'TARJETA' | 'YAPE' | 'PAGOEFECTIVO'

  // Referencias opcionales a otras tablas
  pagoId: uuid('pago_id').references(() => pago.id, { onDelete: 'set null' }),
  pagoFlowId: uuid('pago_flow_id').references(() => pagoFlow.id, {
    onDelete: 'set null'
  }),
  prestamoId: uuid('prestamo_id').references(() => prestamo.id, {
    onDelete: 'set null'
  }),

  descripcion: text('descripcion'),
  fechaMovimiento: timestamp('fecha_movimiento', {
    withTimezone: true
  }).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
