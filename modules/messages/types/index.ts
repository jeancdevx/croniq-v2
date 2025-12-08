export type DebtorStatus = 'vencido' | 'vence_hoy' | 'proximo'

export interface Debtor {
  id: string
  nombre: string
  dni: string
  telefono: string
  deuda: number
  vencimiento: string
  estado: DebtorStatus
  diasRestantes: number
}

export interface ReminderConfig {
  selectedDays: number[]
  customDays?: number
}

export interface SendingState {
  [key: string]: boolean
}
