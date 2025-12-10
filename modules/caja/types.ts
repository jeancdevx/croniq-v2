export type TipoMovimiento = 'INGRESO' | 'EGRESO'
export type CategoriaMovimiento =
  | 'CAPITAL_INICIAL'
  | 'PAGO_EFECTIVO'
  | 'PAGO_FLOW'
  | 'DESEMBOLSO'

export type EstadoSesion = 'ABIERTA' | 'CERRADA'

export interface SesionCaja {
  id: string
  numeroSesion: number
  fecha: Date
  fechaApertura: Date
  saldoInicial: string
  fechaCierre: Date | null
  saldoFinalTeorico: string | null
  saldoFinalReal: string | null
  diferencia: string | null
  estado: EstadoSesion
  observaciones: string | null
}

export interface MovimientoCaja {
  id: string
  cajaSesionId: string
  tipo: TipoMovimiento
  categoria: CategoriaMovimiento
  monto: string
  montoBruto: string | null
  comisionFlow: string | null
  medioPagoFlow: string | null
  pagoId: string | null
  pagoFlowId: string | null
  prestamoId: string | null
  descripcion: string | null
  fechaMovimiento: Date
}

export interface ResumenSesion {
  sesion: SesionCaja
  totalIngresos: number
  totalEgresos: number
  saldoTeorico: number
  cantidadMovimientos: number
}
