export interface SesionCaja {
  id: string
  numeroSesion: number
  fecha: Date | string
  fechaApertura: Date | string
  fechaCierre: Date | string | null
  saldoInicial: string
  saldoFinalTeorico: string | null
  saldoFinalReal: string | null
  diferencia: string | null
  estado: string
  observaciones: string | null
}

export interface ResumenSesion {
  saldoInicial: number
  saldoTeorico: number
  totalIngresos: number
  totalEgresos: number
  desglose: {
    ingresosEfectivo: number
    ingresosFlow: number
  }
}

export interface Movimiento {
  id: string
  fechaMovimiento: Date | string
  tipo: string
  categoria: string
  descripcion: string | null
  monto: string
  montoBruto?: string | null
  comisionFlow?: string | null
}
