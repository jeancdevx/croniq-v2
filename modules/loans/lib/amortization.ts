import { addMonths, getDaysInMonth, setDate } from 'date-fns'

import { calculateTEM, roundToTwo } from './financial-calcs'

export interface AmortizationParams {
  montoSolicitado: number
  tea: number
  numeroCuotas: number
  fechaDesembolso: Date
  diaVencimiento: number
  tasaSeguroDesgravamen?: number
}

export interface Installment {
  numeroCuota: number
  fechaVencimiento: Date
  capital: number
  interes: number
  totalCuota: number
  seguroDesgravamen: number
  totalConSeguro: number
  saldoRestante: number
}

/**
 * Calcula fecha de vencimiento usando meses exactos (modelo académico)
 * - Si el día no existe en el mes, usa el último día del mes
 * - NO ajusta por días hábiles (fechas exactas como el profesor pide)
 * - Usa date-fns para evitar problemas de timezone
 */
export const calculateDueDate = (
  fechaDesembolso: Date,
  numeroCuota: number,
  diaVencimiento: number
): Date => {
  // Primero sumamos los meses usando date-fns
  const targetDate = addMonths(fechaDesembolso, numeroCuota)

  // Obtener último día del mes objetivo
  const lastDayOfMonth = getDaysInMonth(targetDate)

  // Usar el día de vencimiento o el último día del mes si no existe
  const finalDay = Math.min(diaVencimiento, lastDayOfMonth)

  // Establecer el día correcto
  return setDate(targetDate, finalDay)
}

export const calculateFirstDueDate = (
  fechaDesembolso: Date,
  diaVencimiento: number
): Date => {
  return calculateDueDate(fechaDesembolso, 1, diaVencimiento)
}

/**
 * Calcula cuota total fija usando tasa combinada (interés + seguro)
 *
 * Fórmula: Q = P × i_total / (1 - (1 + i_total)^(-n))
 *
 * Donde i_total = TEM + tasa_seguro
 */
const calculateFixedTotalInstallment = (
  monto: number,
  tem: number,
  tasaSeguro: number,
  numeroCuotas: number
): number => {
  const iTotalMensual = tem + tasaSeguro
  const factor = Math.pow(1 + iTotalMensual, numeroCuotas)
  return (monto * (iTotalMensual * factor)) / (factor - 1)
}

/**
 * Genera cronograma usando modelo ACADÉMICO:
 * - Períodos mensuales iguales (no días reales)
 * - Cuota TOTAL constante (capital + interés + seguro)
 * - Tasa combinada: i_total = TEM + seguro
 * - Saldo llega exactamente a 0
 */
export const generateAmortizationSchedule = (
  params: AmortizationParams
): Installment[] => {
  const {
    montoSolicitado,
    tea,
    numeroCuotas,
    fechaDesembolso,
    diaVencimiento,
    tasaSeguroDesgravamen = 0.0018 // 0.18% mensual
  } = params

  // 1. Calcular TEM (tasa efectiva mensual de interés puro)
  const tem = calculateTEM(tea)

  // 2. Calcular cuota total fija usando tasa combinada
  // i_total = TEM + seguro
  const cuotaTotalFija = calculateFixedTotalInstallment(
    montoSolicitado,
    tem,
    tasaSeguroDesgravamen,
    numeroCuotas
  )

  const cuotas: Installment[] = []
  let saldoPendiente = montoSolicitado

  // 3. Generar cronograma
  for (let i = 1; i <= numeroCuotas; i++) {
    // Fecha de vencimiento (meses exactos, sin ajuste días hábiles)
    const fechaVencimiento = calculateDueDate(
      fechaDesembolso,
      i,
      diaVencimiento
    )

    // Interés del período = saldo × TEM
    const interes = saldoPendiente * tem

    // Seguro del período = saldo × tasa_seguro
    const seguro = saldoPendiente * tasaSeguroDesgravamen

    // Capital = cuota_total - interés - seguro
    let capital = cuotaTotalFija - interes - seguro

    // Última cuota: ajustar capital para saldar exactamente
    if (i === numeroCuotas) {
      capital = saldoPendiente
    }

    // Protección contra negativos por redondeo
    if (capital < 0) {
      capital = 0
    }

    // Actualizar saldo
    saldoPendiente = Math.max(0, saldoPendiente - capital)

    // Totales
    const totalCuota = capital + interes
    const totalConSeguro = totalCuota + seguro

    cuotas.push({
      numeroCuota: i,
      fechaVencimiento,
      capital: roundToTwo(capital),
      interes: roundToTwo(interes),
      totalCuota: roundToTwo(totalCuota),
      seguroDesgravamen: roundToTwo(seguro),
      totalConSeguro: roundToTwo(totalConSeguro),
      saldoRestante: roundToTwo(saldoPendiente)
    })
  }

  return cuotas
}
