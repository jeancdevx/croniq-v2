import z from 'zod'

import { createLoanSchema } from './schemas'

export type CreateLoanInput = z.infer<typeof createLoanSchema>

export type Moneda = 'PEN' // Solo Soles Peruanos

export type EstadoPrestamo = 'ACTIVO' | 'FINALIZADO' | 'ANULADO'
export type EstadoCuota = 'PENDIENTE' | 'PAGADO' | 'VENCIDO'

export interface LoanCalculationResult {
  montoSolicitado: number
  comisionDesembolso: number
  montoDesembolsado: number
  totalAPagar: number

  tea: number
  tem: number
  tcea: number

  cuotaMensual: number
  cuotaConSeguro: number
  numeroCuotas: number

  tipoCambio?: number

  totalIntereses: number
  totalSeguros: number
}

export interface LoanFormData {
  clienteId: string
  clienteNombre?: string
  montoSolicitado: number
  tea: number
  numeroCuotas: number
  monedaPrestamo: Moneda
  monedaPago: Moneda
  fechaDesembolso: string
  diaVencimiento: number
}

export type { AmortizationParams, Installment } from './lib/amortization'
