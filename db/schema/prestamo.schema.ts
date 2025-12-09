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

  // Montos
  montoSolicitado: decimal('monto_solicitado', {
    precision: 12,
    scale: 2
  }).notNull(),
  montoDesembolsado: decimal('monto_desembolsado', {
    precision: 12,
    scale: 2
  }).notNull(), // Monto real que recibe el cliente (después de comisiones)
  totalAPagar: decimal('total_a_pagar', { precision: 12, scale: 2 }).notNull(), // Capital + intereses + seguros

  // Tasas SBS (sobre año 360 días)
  tea: decimal('tea', { precision: 8, scale: 4 }).notNull(), // Tasa Efectiva Anual (ej: 22.0000)
  tem: decimal('tem', { precision: 8, scale: 6 }).notNull(), // Tasa Efectiva Mensual calculada
  tcea: decimal('tcea', { precision: 8, scale: 4 }).notNull(), // Tasa Costo Efectivo Anual
  tasaMora: decimal('tasa_mora', { precision: 8, scale: 4 })
    .default('1.00')
    .notNull(), // 1% mensual fijo

  // Seguros y comisiones (valores fijos para todo el sistema)
  tasaSeguroDesgravamen: decimal('tasa_seguro_desgravamen', {
    precision: 8,
    scale: 6
  })
    .default('0.18')
    .notNull(), // 0.18% mensual sobre saldo
  comisionDesembolso: decimal('comision_desembolso', {
    precision: 12,
    scale: 2
  }).notNull(), // Monto en soles/dólares (SBS 2025: sin comisión)
  porcentajeComisionDesembolso: decimal('porcentaje_comision_desembolso', {
    precision: 5,
    scale: 2
  })
    .default('0.00')
    .notNull(), // 0% (SBS Perú 2025 - sin comisión de desembolso)

  // Plazo y frecuencia
  numeroCuotas: integer('numero_cuotas').notNull(),
  frecuencia: varchar('frecuencia', { length: 20 })
    .default('MENSUAL')
    .notNull(),

  // Monedas
  monedaPrestamo: varchar('moneda_prestamo', { length: 3 }).notNull(), // PEN o USD
  monedaPago: varchar('moneda_pago', { length: 3 }).notNull(), // PEN o USD
  tipoCambioDesembolso: decimal('tipo_cambio_desembolso', {
    precision: 10,
    scale: 4
  }), // Tipo cambio al momento del desembolso (si aplica conversión)

  // Fechas
  fechaDesembolso: date('fecha_desembolso').notNull(),
  fechaPrimerVencimiento: date('fecha_primer_vencimiento').notNull(),
  diaVencimiento: integer('dia_vencimiento').notNull(), // Día del mes para vencimientos (1-31)

  // Estado
  estado: varchar('estado', { length: 20 }).default('ACTIVO').notNull(), // ACTIVO, FINALIZADO, ANULADO

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
