import {
  decimal,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

import { pagoFlow } from './pago-flow.schema'

/**
 * Tabla: comprobante
 * Registro de comprobantes de pago emitidos (Boletas/Facturas)
 * Relación 1:1 con pago_flow
 */
export const comprobante = pgTable('comprobante', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Relación con pago_flow (no con pago individual)
  pagoFlowId: uuid('pago_flow_id')
    .notNull()
    .references(() => pagoFlow.id, { onDelete: 'restrict' }),

  // Identificación del comprobante
  tipoComprobante: varchar('tipo_comprobante', { length: 20 }).notNull(), // "BOLETA", "FACTURA"
  serie: varchar('serie', { length: 4 }).notNull(), // "B001"
  numero: varchar('numero', { length: 8 }).notNull(), // "00000001"
  numeroCompleto: varchar('numero_completo', { length: 15 }).notNull(), // "B001-00000001"

  // Datos del comprobante
  fechaEmision: timestamp('fecha_emision', { withTimezone: true }).notNull(),
  montoTotal: decimal('monto_total', { precision: 12, scale: 2 }).notNull(),
  igv: decimal('igv', { precision: 12, scale: 2 }).default('0.00').notNull(), // Siempre 0 para servicios financieros

  // Datos digitales
  hash: varchar('hash', { length: 64 }).notNull(), // SHA-256
  qrData: text('qr_data').notNull(), // Datos del QR en formato SUNAT

  // Archivos (opcional - solo para test)
  pdfPath: varchar('pdf_path', { length: 255 }), // Ruta relativa al PDF

  // Estado
  estado: varchar('estado', { length: 20 }).default('EMITIDO').notNull(), // "EMITIDO", "ANULADO"
  motivoAnulacion: text('motivo_anulacion'),
  fechaAnulacion: timestamp('fecha_anulacion', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
