export interface Pago {
  id: string
  clienteNombre: string
  clienteDni: string
  fechaPago: Date
  monto: number
  medioPago: 'Efectivo' | 'Transferencia' | 'Flow' | 'Yape' | 'Plin'
  codigoOperacion?: string
  estado: 'Completado' | 'Pendiente' | 'Fallido'
  url?: string
}

export type NuevoPago = Omit<Pago, 'id'>
