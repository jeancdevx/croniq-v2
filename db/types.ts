import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import * as schema from './schema'

export type Cliente = InferSelectModel<typeof schema.cliente>
export type NewCliente = InferInsertModel<typeof schema.cliente>

export type Prestamo = InferSelectModel<typeof schema.prestamo>
export type NewPrestamo = InferInsertModel<typeof schema.prestamo>

export type EstadoPrestamo = 'ACTIVO' | 'FINALIZADO' | 'ANULADO'

export type Cuota = InferSelectModel<typeof schema.cuota>
export type NewCuota = InferInsertModel<typeof schema.cuota>

export type EstadoCuota = 'PENDIENTE' | 'PAGADO' | 'VENCIDO'

export type Pago = InferSelectModel<typeof schema.pago>
export type NewPago = InferInsertModel<typeof schema.pago>

export type MedioPago = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA'

export type Movimiento = InferSelectModel<typeof schema.movimientos>
export type NewMovimiento = InferInsertModel<typeof schema.movimientos>

export type TipoMovimiento = 'INGRESO' | 'EGRESO'

export type ClienteConPrestamos = Cliente & {
  prestamos: Prestamo[]
}

export type PrestamoConCuotas = Prestamo & {
  cuotas: Cuota[]
  cliente: Cliente
}

export type CuotaConPago = Cuota & {
  pago: Pago | null
}

export type PrestamoCompleto = Prestamo & {
  cliente: Cliente
  cuotas: CuotaConPago[]
}
