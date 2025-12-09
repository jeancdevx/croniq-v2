import { adjustToNextBusinessDay } from './business-days'
import {
  calculateFrenchInstallment,
  calculateInsurance,
  calculateInterestForPeriod,
  calculateTEM,
  roundToTwo
} from './financial-calcs'

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
 * Calcula días entre dos fechas
 */
const daysBetween = (start: Date, end: Date): number => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const startUTC = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  )
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.floor((endUTC - startUTC) / MS_PER_DAY)
}

/**
 * Calcula fecha de vencimiento según Código Civil Peruano Art. 183:
 * - Si el día existe en el mes: usa ese día
 * - Si no existe (ej: 31 feb): usa el último día del mes
 */
export const calculateDueDate = (
  fechaDesembolso: Date,
  numeroCuota: number,
  diaVencimiento: number
): Date => {
  const year = fechaDesembolso.getFullYear()
  const month = fechaDesembolso.getMonth()

  // Calcular el mes objetivo
  const targetMonth = month + numeroCuota
  const targetYear = year + Math.floor(targetMonth / 12)
  const finalMonth = targetMonth % 12

  // Crear fecha con el mes y año correctos, día 1
  const fecha = new Date(targetYear, finalMonth, 1)

  // Obtener el último día del mes
  const lastDayOfMonth = new Date(targetYear, finalMonth + 1, 0).getDate()

  // Usar el día de vencimiento o el último día del mes si no existe
  const finalDay = Math.min(diaVencimiento, lastDayOfMonth)

  fecha.setDate(finalDay)

  // IMPORTANTE: Ajustar a siguiente día hábil si cae en fin de semana/feriado
  const fechaAjustada = adjustToNextBusinessDay(fecha)

  return fechaAjustada
}

export const calculateFirstDueDate = (
  fechaDesembolso: Date,
  diaVencimiento: number
): Date => {
  return calculateDueDate(fechaDesembolso, 1, diaVencimiento)
}

/**
 * Genera cronograma EXACTO según BBVA/SBS Perú:
 * - CUOTA TOTAL FIJA = Capital + Interés + Seguro
 * - Capital CRECE (compensa interés decreciente)
 * - Interés DECRECE (calculado con días reales)
 * - Seguro DECRECE (sobre saldo decreciente, con días reales)
 * - Saldo llega a exactamente 0
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
    tasaSeguroDesgravamen = 0.0018
  } = params

  // 1. TEM promedio (base 30 días) para calcular cuota de referencia
  const tem = calculateTEM(tea)

  // 2. Cuota base sin seguro
  const cuotaBaseSinSeguro = calculateFrenchInstallment(
    montoSolicitado,
    tem,
    numeroCuotas
  )

  // 3. Estimar seguro promedio para obtener cuota total fija
  const saldoPromedio = montoSolicitado / 2
  const seguroPromedio = saldoPromedio * tasaSeguroDesgravamen

  // 4. CUOTA TOTAL FIJA (incluye seguro estimado)
  const cuotaTotalFija = cuotaBaseSinSeguro + seguroPromedio

  const cuotas: Installment[] = []
  let saldoPendiente = montoSolicitado
  let fechaAnterior = fechaDesembolso

  // 5. Generar cronograma manteniendo CUOTA TOTAL FIJA
  for (let i = 1; i <= numeroCuotas; i++) {
    // Fecha de vencimiento (ajustada a día hábil)
    const fechaVencimiento = calculateDueDate(
      fechaDesembolso,
      i,
      diaVencimiento
    )

    // Días reales entre pagos
    const diasReales = daysBetween(fechaAnterior, fechaVencimiento)

    // Interés con días reales sobre saldo actual
    const interes = calculateInterestForPeriod(saldoPendiente, tea, diasReales)

    // Seguro con días reales sobre saldo actual
    const seguro = calculateInsurance(
      saldoPendiente,
      tasaSeguroDesgravamen,
      diasReales
    )

    // CLAVE: Capital se AJUSTA para mantener cuota total fija
    // Capital = CuotaFija - Interés - Seguro
    // Como interés y seguro DECRECEN, capital CRECE
    let capital = cuotaTotalFija - interes - seguro

    // Última cuota: ajustar para saldar exactamente
    if (i === numeroCuotas) {
      capital = saldoPendiente
    }

    // Validación
    if (capital < 0) {
      capital = 0
    }
    if (capital > saldoPendiente) {
      capital = saldoPendiente
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

    fechaAnterior = fechaVencimiento
  }

  return cuotas
}
