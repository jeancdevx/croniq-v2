import { differenceInMonths, isAfter, startOfDay } from 'date-fns'

/**
 * Sistema de Moras - Modelo Académico
 *
 * Reglas:
 * - 1% mensual sobre saldo pendiente de cada cuota
 * - Sin anatocismo (sin interés sobre interés)
 * - Moras se evalúan al día siguiente del vencimiento
 * - Pagos se aplican: mora primero, luego capital de cuota más antigua
 */

export const TASA_MORA_MENSUAL = 0.01 // 1% mensual

export interface CuotaConMora {
  id: string
  numeroCuota: number
  fechaVencimiento: string
  totalConSeguro: number
  saldoPendiente: number
  montoMora: number
  estado: string
}

export interface ResultadoPago {
  cuotasActualizadas: Array<{
    numeroCuota: number
    moraAplicada: number
    capitalAplicado: number
    saldoRestante: number
    estadoFinal: string
  }>
  montoSobrante: number
  totalMorasPagadas: number
  totalCapitalPagado: number
}

/**
 * Calcula los meses de atraso desde la fecha de vencimiento
 * Solo cuenta meses completos transcurridos
 */
export const calculateMonthsOverdue = (
  fechaVencimiento: Date,
  fechaActual: Date = new Date()
): number => {
  const vencimiento = startOfDay(fechaVencimiento)
  const actual = startOfDay(fechaActual)

  // Si no está vencida, 0 meses
  if (!isAfter(actual, vencimiento)) {
    return 0
  }

  // Calcular meses completos de diferencia
  const meses = differenceInMonths(actual, vencimiento)

  // Si han pasado días pero menos de un mes, cuenta como 1
  return Math.max(meses, 1)
}

/**
 * Calcula la mora acumulada para una cuota
 * Fórmula: SaldoPendiente × TasaMora × MesesAtraso
 * SIN anatocismo (no se calcula interés sobre la mora)
 *
 * @param saldoPendiente - Saldo pendiente de la cuota original
 * @param mesesAtraso - Número de meses de atraso
 * @param tasaMora - Tasa mensual (default 0.01 = 1%)
 */
export const calculateLateFee = (
  saldoPendiente: number,
  mesesAtraso: number,
  tasaMora: number = TASA_MORA_MENSUAL
): number => {
  if (saldoPendiente <= 0 || mesesAtraso <= 0) {
    return 0
  }

  // Mora simple: saldo × tasa × meses (NO compuesto)
  return Math.round(saldoPendiente * tasaMora * mesesAtraso * 100) / 100
}

/**
 * Calcula mora y estado actualizado para una cuota
 */
export const evaluateCuotaLateFee = (
  cuota: {
    fechaVencimiento: string
    totalConSeguro: string | number
    montoPagado: string | number
    estado: string
  },
  fechaActual: Date = new Date()
): { montoMora: number; diasMora: number; estado: string } => {
  const fechaVenc = new Date(cuota.fechaVencimiento + 'T12:00:00')
  const total = Number(cuota.totalConSeguro)
  const pagado = Number(cuota.montoPagado || 0)
  const saldoPendiente = total - pagado

  // Si ya está pagada completamente
  if (saldoPendiente <= 0 || cuota.estado === 'PAGADO') {
    return { montoMora: 0, diasMora: 0, estado: 'PAGADO' }
  }

  // Calcular días y meses de atraso
  const hoy = startOfDay(fechaActual)
  const vencimiento = startOfDay(fechaVenc)

  if (!isAfter(hoy, vencimiento)) {
    // No está vencida todavía
    return { montoMora: 0, diasMora: 0, estado: 'PENDIENTE' }
  }

  // Calcular días de atraso
  const diasMora = Math.floor(
    (hoy.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calcular meses de atraso (para la mora)
  const mesesAtraso = calculateMonthsOverdue(fechaVenc, fechaActual)

  // Calcular mora
  const montoMora = calculateLateFee(saldoPendiente, mesesAtraso)

  return {
    montoMora,
    diasMora,
    estado: 'VENCIDO'
  }
}

/**
 * Aplica un pago a las cuotas siguiendo el orden correcto:
 * 1. Mora de la cuota más antigua
 * 2. Saldo de la cuota más antigua
 * 3. Siguiente cuota...
 *
 * @param cuotas - Cuotas ordenadas por antigüedad (más antigua primero)
 * @param montoPago - Monto a aplicar
 * @returns Resultado del pago con desglose
 */
export const distributePayment = (
  cuotas: CuotaConMora[],
  montoPago: number
): ResultadoPago => {
  let pagoRestante = montoPago
  let totalMorasPagadas = 0
  let totalCapitalPagado = 0
  const cuotasActualizadas: ResultadoPago['cuotasActualizadas'] = []

  for (const cuota of cuotas) {
    if (pagoRestante <= 0) break
    if (cuota.estado === 'PAGADO') continue

    let moraAplicada = 0
    let capitalAplicado = 0

    // 1. Primero aplicar a mora
    if (cuota.montoMora > 0 && pagoRestante > 0) {
      const pagoMora = Math.min(pagoRestante, cuota.montoMora)
      moraAplicada = pagoMora
      pagoRestante -= pagoMora
      totalMorasPagadas += pagoMora
    }

    // 2. Luego aplicar a saldo de cuota
    if (cuota.saldoPendiente > 0 && pagoRestante > 0) {
      const pagoCapital = Math.min(pagoRestante, cuota.saldoPendiente)
      capitalAplicado = pagoCapital
      pagoRestante -= pagoCapital
      totalCapitalPagado += pagoCapital
    }

    const saldoRestante = cuota.saldoPendiente - capitalAplicado
    const moraRestante = cuota.montoMora - moraAplicada

    cuotasActualizadas.push({
      numeroCuota: cuota.numeroCuota,
      moraAplicada: Math.round(moraAplicada * 100) / 100,
      capitalAplicado: Math.round(capitalAplicado * 100) / 100,
      saldoRestante: Math.round(saldoRestante * 100) / 100,
      estadoFinal:
        saldoRestante <= 0 && moraRestante <= 0 ? 'PAGADO' : 'VENCIDO'
    })
  }

  return {
    cuotasActualizadas,
    montoSobrante: Math.round(pagoRestante * 100) / 100,
    totalMorasPagadas: Math.round(totalMorasPagadas * 100) / 100,
    totalCapitalPagado: Math.round(totalCapitalPagado * 100) / 100
  }
}
