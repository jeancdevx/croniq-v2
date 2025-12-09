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

export const calculateInterest = (
  saldoPendiente: number,
  tem: number
): number => {
  return saldoPendiente * tem
}

export const calculateInsurance = (
  saldoPendiente: number,
  tasaSeguro: number = 0.0018
): number => {
  return saldoPendiente * tasaSeguro
}

export const calculateDisbursementFee = (
  montoSolicitado: number,
  porcentaje: number = 0.02
): number => {
  return montoSolicitado * porcentaje
}

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
