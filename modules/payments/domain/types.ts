export interface Pago {
  id: string
  clienteNombre: string
  clienteDni: string
  fechaPago: Date
  monto: number
  medioPago: string
  codigoOperacion?: string
  estado: 'Completado' | 'Pendiente' | 'Fallido'
  url?: string
  type?: 'FLOW' | 'CASH'
}

export type NuevoPago = Omit<Pago, 'id'>
