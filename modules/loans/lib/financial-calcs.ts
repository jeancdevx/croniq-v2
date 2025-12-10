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
 * Calcula TCEA usando períodos mensuales (modelo académico)
 *
 * La TCEA es la tasa anual que iguala el monto desembolsado
 * con la serie de cuotas mensuales iguales.
 *
 * @param montoDesembolsado - Monto que recibe el cliente
 * @param cuotaMensual - Cuota total fija mensual
 * @param numeroCuotas - Número de cuotas
 * @returns TCEA anual (decimal)
 */
export const calculateTCEAMonthly = (
  montoDesembolsado: number,
  cuotaMensual: number,
  numeroCuotas: number
): number => {
  // Encontrar TIR mensual usando Newton-Raphson
  // VPN = -monto + cuota × (1 - (1+r)^(-n)) / r = 0

  let rm = 0.02 // Estimación inicial: 2% mensual
  const epsilon = 0.000001
  const maxIterations = 100

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const factor = Math.pow(1 + rm, -numeroCuotas)
    const vpn = -montoDesembolsado + (cuotaMensual * (1 - factor)) / rm

    // Derivada del VPN respecto a rm
    const derivada =
      cuotaMensual *
      ((numeroCuotas * factor) / (rm * (1 + rm)) - (1 - factor) / (rm * rm))

    const rmNueva = rm - vpn / derivada

    if (Math.abs(rmNueva - rm) < epsilon) {
      // Convertir TIR mensual a TCEA anual
      return Math.pow(1 + rmNueva, 12) - 1
    }

    rm = rmNueva
  }

  // Si no converge, retornar estimación
  return Math.pow(1 + rm, 12) - 1
}

/**
 * Calcula TCEA usando días reales / 360 (método BBVA/SBS Perú)
 * DEPRECATED: Usar calculateTCEAMonthly para modelo académico
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

export const roundToTwo = (num: number): number => {
  return Math.round(num * 100) / 100
}

export const roundToFour = (num: number): number => {
  return Math.round(num * 10000) / 10000
}

export const roundToSix = (num: number): number => {
  return Math.round(num * 1000000) / 1000000
}
