export interface Cliente {
  dni: string
  nombres: string
  apellidos: string
  nombreCompleto: string
  esPep: boolean
}

export interface Prestamo {
  id: string
  fechaRegistro: string
  fechaDesembolso: string
  cliente: Cliente
  monto: number
  plazo: number // meses
  tasaAnualFija: number // porcentaje
  cuotaMensual: number
  moraMensual: number // 1% del monto
  totalPagar: number
  tcea: number // porcentaje
  cronogramaPagos: CuotaPrestamo[]
}

export interface CuotaPrestamo {
  numeroCuota: number
  fechaVencimiento: string
  montoCuota: number
  montoPagado: number
  moraPagada: number
  moraAcumulada: number
  diasAtraso: number
  estado: 'pendiente' | 'pagada' | 'atrasada'
  fechaPago: string | null
}

export interface RegistroPrestamoForm {
  dni: string
  nombres: string
  apellidos: string
  esPep: boolean
  monto: number
  plazo: number
  tasaAnual: number
  fechaDesembolso: string
}

export interface RegistroPagoForm {
  prestamoId: string
  numeroCuotas: number
  montoPago: number
}
