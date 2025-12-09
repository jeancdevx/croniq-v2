export const calculateTEM = (tea: number): number => {
  return Math.pow(1 + tea, 1 / 12) - 1
}

export const calculateFrenchInstallment = (
  monto: number,
  tem: number,
  plazo: number
): number => {
  if (tem === 0) return monto / plazo
  return monto * (tem / (1 - Math.pow(1 + tem, -plazo)))
}

/**
 * Calcula el interés de un período usando TEA base 360 días (SBS Perú)
 * con días reales del período
 *
 * Fórmula: i_periodo = (1 + TEA)^(días_reales/360) - 1
 *
 * @param saldoPendiente - Saldo sobre el cual calcular interés
 * @param tea - Tasa Efectiva Anual (decimal, ej: 0.22 para 22%)
 * @param diasReales - Número de días reales del período (28, 29, 30, 31)
 * @returns Interés del período
 */
export const calculateInterestForPeriod = (
  saldoPendiente: number,
  tea: number,
  diasReales: number
): number => {
  // i_t = (1 + TEA)^(t/360) - 1
  const tasaPeriodo = Math.pow(1 + tea, diasReales / 360) - 1
  return saldoPendiente * tasaPeriodo
}

/**
 * Calcula interés usando TEM (para sistema simplificado)
 */
export const calculateInterest = (
  saldoPendiente: number,
  tem: number
): number => {
  return saldoPendiente * tem
}

/**
 * Calcula el seguro de desgravamen prorrateado por días reales
 * según estándar BBVA/SBS Perú
 *
 * Fórmula: F_t = F_30 × (días_reales/30)
 *          Prima = saldo × F_t
 *
 * @param saldoPendiente - Saldo sobre el cual calcular el seguro
 * @param tasaMensual - Tasa mensual base 30 días (ej: 0.0018 para 0.18%)
 * @param diasReales - Días reales del período (28, 29, 30, 31, etc.)
 * @returns Prima de seguro del período
 */
export const calculateInsurance = (
  saldoPendiente: number,
  tasaMensual: number,
  diasReales: number
): number => {
  // Prorratear la tasa mensual por días reales
  const tasaPeriodo = tasaMensual * (diasReales / 30)
  return saldoPendiente * tasaPeriodo
}

export const calculateDisbursementFee = (
  montoSolicitado: number,
  porcentaje: number = 0.02
): number => {
  return montoSolicitado * porcentaje
}

/**
 * Calcula TCEA usando días reales / 360 (método BBVA/SBS Perú)
 *
 * @param montoDesembolsado - Monto que recibe el cliente
 * @param cuotas - Array de objetos {monto, diasDesdeDesembolso}
 * @returns TCEA anual (decimal)
 */
export const calculateTCEAWithDays = (
  montoDesembolsado: number,
  cuotas: Array<{ monto: number; dias: number }>
): number => {
  // Método de Newton-Raphson para encontrar la TCEA
  // VPN = -montoDesembolsado + sum(cuota[i] / (1+TCEA)^(días[i]/360)) = 0

  let tcea = 0.25 // Estimación inicial: 25% anual
  const epsilon = 0.000001
  const maxIterations = 100

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let vpn = -montoDesembolsado
    let derivada = 0

    for (const cuota of cuotas) {
      const exponente = cuota.dias / 360
      const factor = Math.pow(1 + tcea, exponente)
      vpn += cuota.monto / factor
      derivada -= (exponente * cuota.monto) / (factor * (1 + tcea))
    }

    const tceaNueva = tcea - vpn / derivada

    if (Math.abs(tceaNueva - tcea) < epsilon) {
      return tceaNueva
    }

    tcea = tceaNueva
  }

  return tcea
}

/**
 * Calcula TCEA usando períodos mensuales (método simplificado)
 * DEPRECATED: Usar calculateTCEAWithDays para cálculos precisos
 */
export const calculateTCEA = (
  montoDesembolsado: number,
  cuotas: number[], // Array de cuotas mensuales
  plazo: number
): number => {
  // Método de Newton-Raphson para encontrar la TIR
  let tir = 0.02 // Estimación inicial: 2% mensual
  const epsilon = 0.000001
  const maxIterations = 100

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // VPN = -montoDesembolsado + sum(cuota[i] / (1+r)^i)
    let vpn = -montoDesembolsado
    let derivada = 0

    for (let i = 1; i <= plazo; i++) {
      const cuota = cuotas[i - 1] || cuotas[0] // Usar cuota específica o primera si no existe
      const factor = Math.pow(1 + tir, i)
      vpn += cuota / factor
      derivada -= (i * cuota) / (factor * (1 + tir))
    }

    const tirNueva = tir - vpn / derivada

    if (Math.abs(tirNueva - tir) < epsilon) {
      // Convertir TIR mensual a anual
      return Math.pow(1 + tirNueva, 12) - 1
    }

    tir = tirNueva
  }

  // Si no converge, retornar estimación
  return Math.pow(1 + tir, 12) - 1
}

export const roundToTwo = (num: number): number => {
  return Math.round(num * 100) / 100
}

export const roundToFour = (num: number): number => {
  return Math.round(num * 10000) / 10000
}

export const roundToSix = (num: number): number => {
  return Math.round(num * 1000000) / 1000000
}
