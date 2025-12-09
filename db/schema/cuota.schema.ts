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
    numeroCuota: integer('numero_cuota').notNull(), // 1, 2, 3, ..., N

    // Desglose de la cuota (sistema francés)
    capital: decimal('capital', { precision: 12, scale: 2 }).notNull(), // Amortización de capital
    interes: decimal('interes', { precision: 12, scale: 2 }).notNull(), // Interés del período
    seguroDesgravamen: decimal('seguro_desgravamen', {
      precision: 12,
      scale: 2
    })
      .default('0.00')
      .notNull(), // Seguro sobre saldo (0.18% mensual)

    totalCuota: decimal('total_cuota', { precision: 12, scale: 2 }).notNull(), // capital + interes
    totalConSeguro: decimal('total_con_seguro', {
      precision: 12,
      scale: 2
    }).notNull(), // totalCuota + seguro (lo que realmente paga el cliente)

    // Saldos
    saldoRestante: decimal('saldo_restante', {
      precision: 12,
      scale: 2
    }).notNull(), // Saldo de capital después de pagar esta cuota

    // Mora
    diasMora: integer('dias_mora').default(0).notNull(), // Días de atraso desde vencimiento
    montoMora: decimal('monto_mora', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(), // Mora acumulada (1% mensual sobre saldo)

    // Control de pagos
    montoPagado: decimal('monto_pagado', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(), // Cuánto se ha pagado (para pagos parciales)
    saldoPendiente: decimal('saldo_pendiente', {
      precision: 12,
      scale: 2
    }), // null = no pagado, 0 = pagado completo, >0 = pago parcial

    // Fechas
    fechaVencimiento: date('fecha_vencimiento').notNull(),
    fechaPago: timestamp('fecha_pago', { withTimezone: true }), // Cuándo se pagó (null si pendiente)

    // Estado
    estado: varchar('estado', { length: 20 }).default('PENDIENTE').notNull(), // PENDIENTE, PAGADO, VENCIDO

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  table => ({
    uniquePrestamoNumeroCuota: unique().on(table.prestamoId, table.numeroCuota)
  })
)
