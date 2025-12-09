import {
  calculateFrenchInstallment,
  calculateInsurance,
  calculateInterest,
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

  // 1. Calcular TEM
  const tem = calculateTEM(tea)

  // 2. Calcular cuota fija (sistema francés)
  const cuotaFija = calculateFrenchInstallment(
    montoSolicitado,
    tem,
    numeroCuotas
  )

  const cuotas: Installment[] = []
  let saldoPendiente = montoSolicitado

  // 3. Generar cada cuota
  for (let i = 1; i <= numeroCuotas; i++) {
    // Calcular interés del período
    const interes = calculateInterest(saldoPendiente, tem)

    // Calcular capital (amortización)
    const capital = cuotaFija - interes

    // Actualizar saldo
    saldoPendiente = saldoPendiente - capital

    // Calcular seguro sobre saldo ANTES del pago
    const seguro = calculateInsurance(
      saldoPendiente + capital,
      tasaSeguroDesgravamen
    )

    // Calcular fecha de vencimiento
    const fechaVencimiento = calculateDueDate(
      fechaDesembolso,
      i,
      diaVencimiento
    )

    cuotas.push({
      numeroCuota: i,
      fechaVencimiento,
      capital: roundToTwo(capital),
      interes: roundToTwo(interes),
      totalCuota: roundToTwo(cuotaFija),
      seguroDesgravamen: roundToTwo(seguro),
      totalConSeguro: roundToTwo(cuotaFija + seguro),
      saldoRestante: roundToTwo(Math.max(0, saldoPendiente))
    })
  }

  return cuotas
}

export const calculateDueDate = (
  fechaDesembolso: Date,
  numeroCuota: number,
  diaVencimiento: number
): Date => {
  const fecha = new Date(fechaDesembolso)

  // Sumar meses
  fecha.setMonth(fecha.getMonth() + numeroCuota)

  // Establecer el día de vencimiento
  fecha.setDate(diaVencimiento)

  // Ajustar si el día no existe en el mes (ej: 31 en febrero)
  if (fecha.getDate() !== diaVencimiento) {
    // Si el día no existe, usar el último día del mes
    fecha.setDate(0) // Retrocede al último día del mes anterior
  }

  return fecha
}

export const calculateFirstDueDate = (
  fechaDesembolso: Date,
  diaVencimiento: number
): Date => {
  return calculateDueDate(fechaDesembolso, 1, diaVencimiento)
}
