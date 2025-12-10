export type MedioPagoFlow = 'TARJETA' | 'YAPE' | 'PAGOEFECTIVO'

interface ComisionConfig {
  porcentaje: number
  fija: number
}

/**
 * Configuración de comisiones de Flow según medio de pago
 * Fuente: Tabla de comisiones de Flow.cl
 */
const COMISIONES_FLOW: Record<MedioPagoFlow, ComisionConfig> = {
  TARJETA: { porcentaje: 0.035, fija: 0.8 }, // 3.50% + S/ 0.80
  YAPE: { porcentaje: 0.035, fija: 0.8 }, // 3.50% + S/ 0.80
  PAGOEFECTIVO: { porcentaje: 0.039, fija: 0.8 } // 3.90% + S/ 0.80
}

/**
 * Calcula la comisión de Flow según el medio de pago
 * @param montoBruto - Monto total que paga el cliente
 * @param medioPago - Medio de pago utilizado
 * @returns Objeto con desglose de comisiones y monto neto
 */
export function calcularComisionFlow(
  montoBruto: number,
  medioPago: MedioPagoFlow
) {
  const config = COMISIONES_FLOW[medioPago]

  const comisionPorcentaje = montoBruto * config.porcentaje
  const comisionTotal = comisionPorcentaje + config.fija
  const montoNeto = montoBruto - comisionTotal

  return {
    comisionPorcentaje: Number(comisionPorcentaje.toFixed(2)),
    comisionFija: config.fija,
    comisionTotal: Number(comisionTotal.toFixed(2)),
    montoNeto: Number(montoNeto.toFixed(2))
  }
}

/**
 * Determina el medio de pago Flow a partir del código de Flow
 * @param medioPagoRaw - Código de medio de pago de Flow
 * @returns Medio de pago normalizado
 */
export function determinarMedioPagoFlow(medioPagoRaw: string): MedioPagoFlow {
  const medio = medioPagoRaw.toUpperCase()

  if (
    medio.includes('TARJETA') ||
    medio.includes('CARD') ||
    medio.includes('WEBPAY')
  ) {
    return 'TARJETA'
  }

  if (medio.includes('YAPE')) {
    return 'YAPE'
  }

  if (medio.includes('PAGOEFECTIVO') || medio.includes('PAGO EFECTIVO')) {
    return 'PAGOEFECTIVO'
  }

  // Por defecto, asumir tarjeta
  return 'TARJETA'
}
